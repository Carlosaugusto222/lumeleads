import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const submitInput = z.object({
  site_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().max(200).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
});

// Public — no auth. Uses anon key, protected by RLS (only published sites).
export const submitToSite = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => submitInput.parse(i))
  .handler(async ({ data }) => {
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await sb.from("site_submissions").insert({
      site_id: data.site_id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      message: data.message || null,
    });
    if (error) throw new Error(error.message);
    // Notify site owner (need admin client to look up owner + insert notification).
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { notifyUser } = await import("./notify.server");
      const { data: site } = await supabaseAdmin
        .from("sites")
        .select("user_id, title, slug")
        .eq("id", data.site_id)
        .maybeSingle();
      if (site?.user_id) {
        await notifyUser({
          userId: site.user_id,
          title: "Novo contato pelo site",
          message: `${data.name} enviou uma mensagem em "${site.title}".`,
          type: "success",
          link: "/app/leads",
        });
      }
    } catch (e) {
      console.error("[submitToSite] notify failed:", e);
    }
    return { ok: true };
  });

export const listSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("site_submissions")
      .select("*, sites(title, slug)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data;
  });
