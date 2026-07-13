import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({
  businessName: z.string().min(1).max(80),
  sector: z.string().min(1).max(200),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  style: z.enum(["moderno", "classico", "playful", "minimal"]).default("minimal"),
});

const IMG_ENDPOINT = "https://ai.gateway.lovable.dev/v1/images/generations";

export const generateLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => input.parse(i))
  .handler(async ({ data, context }): Promise<{ dataUrl: string }> => {
    const { enforceRateLimit } = await import("./security.server");
    await enforceRateLimit(context.userId, "generate_logo", 20);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurado");

    const styleHint =
      data.style === "moderno"
        ? "geometric, modern, tech-forward"
        : data.style === "classico"
        ? "elegant, serif, timeless"
        : data.style === "playful"
        ? "friendly, rounded, colorful"
        : "minimalist, clean, ample negative space";

    const prompt = `Simple, iconic vector-style logo for a small business named "${data.businessName}" in the "${data.sector}" sector.
Style: ${styleHint}.
Palette: primary ${data.primaryColor ?? "#7c3aed"}, accent ${data.accentColor ?? "#22d3ee"}, on solid white background.
Requirements: centered mark, no text/typography, no watermark, no photorealism, no gradients-heavy, flat with subtle depth, high contrast, square 1:1, safe padding around the mark.`;

    const res = await fetch(IMG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error(`Falha ao gerar logo [${res.status}]: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("Resposta da IA sem imagem");
    return { dataUrl: `data:image/png;base64,${b64}` };
  });
