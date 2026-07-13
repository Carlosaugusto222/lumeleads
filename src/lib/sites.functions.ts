import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatJSON } from "./ai-gateway.server";

// ---------- Shared schema for generated site content ----------

export const socialsSchema = z.object({
  instagram: z.string().optional().default(""),
  facebook: z.string().optional().default(""),
  whatsapp: z.string().optional().default(""),
  tiktok: z.string().optional().default(""),
  youtube: z.string().optional().default(""),
  x: z.string().optional().default(""),
  website: z.string().optional().default(""),
});
export type Socials = z.infer<typeof socialsSchema>;

export const paletteSchema = z.object({
  primary: z.string(),
  accent: z.string(),
  background: z.string().default("#ffffff"),
  text: z.string().default("#0a0a0a"),
});

export const siteContentSchema = z.object({
  brandName: z.string(),
  tagline: z.string(),
  headline: z.string(),
  subheadline: z.string(),
  ctaLabel: z.string(),
  benefits: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .min(3)
    .max(3),
  about: z.string(),
  testimonials: z
    .array(z.object({ name: z.string(), role: z.string(), quote: z.string() }))
    .min(3)
    .max(3),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .min(3)
    .max(4),
  footerNote: z.string(),
  photos: z.array(z.string().url()).default([]),
  socials: socialsSchema.default({
    instagram: "", facebook: "", whatsapp: "", tiktok: "", youtube: "", x: "", website: "",
  }),
});

export type SiteContent = z.infer<typeof siteContentSchema>;

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40) || "site";
}

// ---------- Generate content + create site ----------

const generateInput = z.object({
  businessName: z.string().min(1).max(80),
  sector: z.string().min(1).max(120),
  audience: z.string().min(1).max(200),
  offer: z.string().min(1).max(400),
  tone: z.enum(["profissional", "descontraido", "premium", "amigavel"]).default("profissional"),
  palette: paletteSchema.optional(),
  photos: z.array(z.string().url()).max(12).optional(),
  socials: socialsSchema.optional(),
});

export const generateSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => generateInput.parse(input))
  .handler(async ({ data, context }) => {
    const prompt = `Você é copywriter especialista em landing pages de alta conversão em português brasileiro.
Gere o conteúdo de uma landing page em JSON, seguindo EXATAMENTE este schema (todos os campos obrigatórios):
{
  "brandName": string (nome da marca),
  "tagline": string (linha curta com posicionamento),
  "headline": string (título principal impactante, máx 90 caracteres),
  "subheadline": string (subtítulo explicando o valor, máx 180 caracteres),
  "ctaLabel": string (texto do botão, máx 25 caracteres),
  "benefits": array com 3 itens { "title": string curto, "description": string 1-2 frases },
  "about": string (parágrafo sobre a empresa, 2-3 frases),
  "testimonials": array com 3 itens { "name": nome brasileiro, "role": cargo/contexto, "quote": depoimento 1-2 frases },
  "faq": array com 3 itens { "question": string, "answer": string 1-2 frases },
  "footerNote": string (nota curta de rodapé)
}

Briefing:
- Negócio: ${data.businessName}
- Setor: ${data.sector}
- Público-alvo: ${data.audience}
- Oferta: ${data.offer}
- Tom: ${data.tone}

Retorne SOMENTE o JSON, sem markdown, sem comentários.`;

    const raw = await chatJSON<Record<string, unknown>>({
      messages: [
        { role: "system", content: "Você retorna somente JSON válido, sem texto extra." },
        { role: "user", content: prompt },
      ],
    });

    const merged = {
      ...raw,
      photos: data.photos ?? [],
      socials: data.socials ?? {
        instagram: "", facebook: "", whatsapp: "", tiktok: "", youtube: "", x: "", website: "",
      },
    };
    const content = siteContentSchema.parse(merged);

    const baseSlug = slugify(content.brandName || data.businessName);
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

    const theme = data.palette
      ? { primary: data.palette.primary, accent: data.palette.accent, background: data.palette.background, text: data.palette.text }
      : { primary: "#7c3aed", accent: "#22d3ee" };

    const { data: site, error } = await context.supabase
      .from("sites")
      .insert({
        user_id: context.userId,
        slug,
        title: content.brandName,
        content: content as unknown as Database["public"]["Tables"]["sites"]["Row"]["content"],
        theme: theme as unknown as Database["public"]["Tables"]["sites"]["Insert"]["theme"],
      })
      .select("id, slug")
      .single();

    if (error || !site) throw new Error(error?.message ?? "Erro ao salvar o site");
    return { id: site.id, slug: site.slug };
  });

// ---------- List user's sites ----------

export const listMySites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sites")
      .select("id, slug, title, published, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

// ---------- Get one site (owner) ----------

export const getMySite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: site, error } = await context.supabase
      .from("sites")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!site) throw new Error("Site não encontrado");
    return site;
  });

// ---------- Update site (content/theme/title) ----------

export const updateSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(120).optional(),
        content: siteContentSchema.optional(),
        theme: z
          .object({
            primary: z.string(),
            accent: z.string(),
            background: z.string().optional(),
            text: z.string().optional(),
            template: z.enum(["modern", "classic", "bold", "minimal"]).optional(),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: Database["public"]["Tables"]["sites"]["Update"] = {};
    if (data.title) patch.title = data.title;
    if (data.content) patch.content = data.content as unknown as Database["public"]["Tables"]["sites"]["Update"]["content"];
    if (data.theme) patch.theme = data.theme as unknown as Database["public"]["Tables"]["sites"]["Update"]["theme"];
    const { error } = await context.supabase.from("sites").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Publish / Unpublish ----------

export const setPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), published: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sites")
      .update({ published: data.published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Delete ----------

export const deleteSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sites").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Public read by slug (no auth) ----------

export const getPublicSite = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: site, error } = await supabase
      .from("sites")
      .select("id, title, slug, theme, content, published")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return site;
  });
