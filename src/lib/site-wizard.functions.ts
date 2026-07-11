import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatJSON } from "./ai-gateway.server";

// ---------- AI palette suggestions ----------

export const paletteSchema = z.object({
  name: z.string(),
  primary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string(),
  mood: z.string().optional(),
});
export type Palette = z.infer<typeof paletteSchema>;

const suggestPaletteInput = z.object({
  sector: z.string().min(1).max(200),
  businessName: z.string().min(1).max(200),
  tone: z.enum(["profissional", "descontraido", "premium", "amigavel"]).default("profissional"),
});

export const suggestPalettes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => suggestPaletteInput.parse(i))
  .handler(async ({ data }) => {
    const prompt = `Sugira 4 paletas de cores harmônicas para uma landing page.
Negócio: ${data.businessName}
Setor: ${data.sector}
Tom: ${data.tone}

Retorne JSON EXATO:
{ "palettes": [
  { "name": "curto rótulo em português", "primary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex", "mood": "descrição curta" }
] }
Regras:
- 4 paletas diferentes (moderna, elegante, vibrante, minimalista adaptadas ao setor)
- Cores em hex 6 dígitos
- primary/accent com bom contraste sobre background
- text legível sobre background (contraste WCAG AA)`;

    const raw = await chatJSON<{ palettes: unknown[] }>({
      messages: [
        { role: "system", content: "Você retorna somente JSON válido." },
        { role: "user", content: prompt },
      ],
    });
    const palettes = z.array(paletteSchema).min(1).max(6).parse(raw.palettes);
    return { palettes };
  });

// ---------- Google Places photos for a lead ----------

const fetchPhotosInput = z.object({
  query: z.string().min(1).max(300), // e.g. "Café da Ana, São Paulo"
  max: z.number().int().min(1).max(10).default(6),
});

type PlacesPhoto = { name: string; widthPx?: number; heightPx?: number };
type PlacesSearchResp = {
  places?: Array<{ id: string; displayName?: { text?: string }; photos?: PlacesPhoto[] }>;
};

const MAPS_GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

export const fetchPlacePhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => fetchPhotosInput.parse(i))
  .handler(async ({ data }): Promise<{ photos: string[] }> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !mapsKey) return { photos: [] };

    const searchRes = await fetch(`${MAPS_GATEWAY}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": mapsKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "places.id,places.displayName,places.photos",
      },
      body: JSON.stringify({ textQuery: data.query, pageSize: 1 }),
    });
    if (!searchRes.ok) return { photos: [] };
    const searchJson = (await searchRes.json()) as PlacesSearchResp;
    const place = searchJson.places?.[0];
    if (!place?.photos?.length) return { photos: [] };

    const urls: string[] = [];
    for (const p of place.photos.slice(0, data.max)) {
      try {
        const mediaRes = await fetch(
          `${MAPS_GATEWAY}/places/v1/${p.name}/media?maxHeightPx=1200&maxWidthPx=1600&skipHttpRedirect=true`,
          {
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": mapsKey,
            },
          },
        );
        if (!mediaRes.ok) continue;
        const j = (await mediaRes.json()) as { photoUri?: string };
        if (j.photoUri) urls.push(j.photoUri);
      } catch {
        /* skip */
      }
    }
    return { photos: urls };
  });

// ---------- Instagram public profile photos (via Firecrawl) ----------

const igInput = z.object({
  handle: z.string().min(1).max(60),
});

export const fetchInstagramPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => igInput.parse(i))
  .handler(async ({ data }): Promise<{ photos: string[] }> => {
    const key = process.env.FIRECRAWL_API_KEY;
    if (!key) throw new Error("Firecrawl não configurado. Conecte em Conectores.");
    const handle = data.handle.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "");
    if (!handle) throw new Error("Handle inválido");
    const url = `https://www.instagram.com/${handle}/`;

    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: ["html", "links"],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Firecrawl [${res.status}]: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      data?: { html?: string; links?: string[]; metadata?: { ogImage?: string } };
    };
    const html = json.data?.html ?? "";
    const found = new Set<string>();
    // og:image (profile pic / hero)
    const og = json.data?.metadata?.ogImage;
    if (og) found.add(og);
    // extract <img src> and srcset urls pointing to instagram cdn
    const re = /https?:\/\/[^"'\s)]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s)]*)?/gi;
    for (const m of html.matchAll(re)) {
      const u = m[0];
      if (/cdninstagram|fbcdn/.test(u)) found.add(u);
      if (found.size >= 12) break;
    }
    // fallback links
    for (const l of json.data?.links ?? []) {
      if (/cdninstagram|fbcdn/.test(l) && /\.(jpg|jpeg|png|webp)/i.test(l)) {
        found.add(l);
        if (found.size >= 12) break;
      }
    }
    return { photos: Array.from(found).slice(0, 12) };
  });
