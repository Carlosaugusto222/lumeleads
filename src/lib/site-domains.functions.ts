import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APEX_TARGET = "lumeleads.lovable.app";

const domainRe = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

function normalizeDomain(input: string) {
  const d = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!domainRe.test(d)) throw new Error("Domínio inválido");
  if (d.endsWith(".lovable.app") || d.endsWith(".lovable.dev")) {
    throw new Error("Use um domínio próprio (não .lovable.app)");
  }
  return d;
}

async function dohQuery(name: string, type: "TXT" | "CNAME" | "A"): Promise<string[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { Accept: "application/dns-json" } });
  if (!res.ok) return [];
  const json = (await res.json()) as { Answer?: { type: number; data: string }[] };
  return (json.Answer ?? []).map((a) => a.data.replace(/^"|"$/g, "").replace(/\.$/, "").toLowerCase());
}

// List domains for a site (owner)
export const listSiteDomains = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ siteId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("site_domains")
      .select("*")
      .eq("site_id", data.siteId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { domains: rows ?? [], target: APEX_TARGET };
  });

// Add domain
export const addSiteDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ siteId: z.string().uuid(), domain: z.string().min(3).max(253) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    const planId = sub?.plan_id ?? "gratuito";
    if (planId === "gratuito") {
      throw new Error("Domínio próprio disponível apenas nos planos pagos. Faça upgrade em /app/billing.");
    }
    const domain = normalizeDomain(data.domain);
    const { data: row, error } = await context.supabase
      .from("site_domains")
      .insert({ site_id: data.siteId, domain })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("Este domínio já está cadastrado");
      throw new Error(error.message);
    }
    return row;
  });

// Verify domain via DNS
export const verifySiteDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("site_domains")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error("Domínio não encontrado");

    const txtName = `_lume-verify.${row.domain}`;
    const [txtRecords, cnameRecords, aRecords] = await Promise.all([
      dohQuery(txtName, "TXT"),
      dohQuery(row.domain, "CNAME"),
      dohQuery(row.domain, "A"),
    ]);

    const expectedToken = row.verification_token.toLowerCase();
    const txtOk = txtRecords.some((r) => r.includes(expectedToken));
    const pointsOk =
      cnameRecords.some((r) => r === APEX_TARGET) ||
      aRecords.length > 0; // via Cloudflare proxy (IPs do Cloudflare)

    let status: "verified" | "failed" = "failed";
    let last_error: string | null = null;
    if (txtOk && pointsOk) status = "verified";
    else if (!txtOk) last_error = `TXT em ${txtName} não encontrado. Adicione TXT com valor "${row.verification_token}".`;
    else last_error = `Domínio não aponta para ${APEX_TARGET}. Configure CNAME.`;

    const { data: updated, error: uerr } = await context.supabase
      .from("site_domains")
      .update({
        status,
        verified_at: status === "verified" ? new Date().toISOString() : null,
        last_checked_at: new Date().toISOString(),
        last_error,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (uerr) throw new Error(uerr.message);
    return updated;
  });

export const deleteSiteDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("site_domains").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public: resolve site by host header (used by root route)
export const resolveSiteByHost = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ host: z.string().min(1).max(253) }).parse(i))
  .handler(async ({ data }) => {
    const host = data.host.toLowerCase().replace(/:\d+$/, "");
    if (host.endsWith(".lovable.app") || host.endsWith(".lovable.dev") || host === "localhost") return null;

    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient<Database>(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: row } = await supabase
      .from("site_domains")
      .select("site_id, sites!inner(slug, published)")
      .eq("domain", host)
      .eq("status", "verified")
      .maybeSingle();

    const site = (row?.sites as unknown as { slug: string; published: boolean } | null) ?? null;
    if (!site || !site.published) return null;
    return { slug: site.slug };
  });

// Called from the landing route loader — reads Host from the incoming request.
export const resolveIncomingHostSite = createServerFn({ method: "GET" }).handler(async () => {
  let host = "";
  try { host = getRequestHost() ?? ""; } catch { return null; }
  if (!host) return null;
  const cleaned = host.toLowerCase().replace(/:\d+$/, "");
  if (cleaned.endsWith(".lovable.app") || cleaned.endsWith(".lovable.dev") || cleaned === "localhost") return null;

  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data: row } = await supabase
    .from("site_domains")
    .select("sites!inner(slug, published)")
    .eq("domain", cleaned)
    .eq("status", "verified")
    .maybeSingle();
  const site = (row?.sites as unknown as { slug: string; published: boolean } | null) ?? null;
  if (!site || !site.published) return null;
  return { slug: site.slug };
});
