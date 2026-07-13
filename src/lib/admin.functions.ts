import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string; claims?: any }) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito");
  // Enforce 2FA (aal2) when the admin has enrolled any verified factor
  const { data: factors } = await ctx.supabase.auth.mfa.listFactors();
  const hasVerified = (factors?.totp ?? []).some((f: any) => f.status === "verified");
  const aal = ctx.claims?.aal ?? "aal1";
  if (hasVerified && aal !== "aal2") throw new Error("2FA obrigatório para admins");
}

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const period = new Date().toISOString().slice(0, 7);
    const [users, sites, leads, subs, usage] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("sites").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("leads").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("subscriptions").select("plan_id"),
      supabaseAdmin.from("usage_counters").select("searches, saved_leads").eq("period", period),
    ]);
    const planCounts: Record<string, number> = {};
    for (const s of subs.data ?? []) planCounts[s.plan_id] = (planCounts[s.plan_id] ?? 0) + 1;
    const monthSearches = (usage.data ?? []).reduce((a, b) => a + (b.searches ?? 0), 0);
    const monthSaved = (usage.data ?? []).reduce((a, b) => a + (b.saved_leads ?? 0), 0);
    return {
      users: users.count ?? 0,
      sites: sites.count ?? 0,
      leads: leads.count ?? 0,
      monthSearches,
      monthSaved,
      planCounts,
    };
  });

export const adminMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ days: z.number().int().min(7).max(90).default(30) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const since = new Date(now.getTime() - data.days * 86400_000);
    const sinceIso = since.toISOString();

    const [profiles, leads, sites, appts, subs, plans] = await Promise.all([
      supabaseAdmin.from("profiles").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin.from("leads").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin.from("sites").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin.from("appointments").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin.from("subscriptions").select("plan_id"),
      supabaseAdmin.from("plans").select("id, name, price_cents"),
    ]);

    const buckets = new Map<string, { date: string; users: number; leads: number; sites: number; appointments: number }>();
    for (let i = 0; i < data.days; i++) {
      const d = new Date(since.getTime() + i * 86400_000).toISOString().slice(0, 10);
      buckets.set(d, { date: d, users: 0, leads: 0, sites: 0, appointments: 0 });
    }
    const bump = (rows: { created_at: string | null }[] | null, key: "users" | "leads" | "sites" | "appointments") => {
      for (const r of rows ?? []) {
        if (!r.created_at) continue;
        const d = r.created_at.slice(0, 10);
        const b = buckets.get(d);
        if (b) b[key]++;
      }
    };
    bump(profiles.data, "users");
    bump(leads.data, "leads");
    bump(sites.data, "sites");
    bump(appts.data, "appointments");

    const priceMap = new Map<string, { name: string; price_cents: number }>();
    for (const p of plans.data ?? []) priceMap.set(p.id, { name: p.name, price_cents: p.price_cents ?? 0 });
    let mrrCents = 0;
    const revenueByPlan: { plan: string; mrr: number; count: number }[] = [];
    const counts: Record<string, number> = {};
    for (const s of subs.data ?? []) counts[s.plan_id] = (counts[s.plan_id] ?? 0) + 1;
    for (const [planId, count] of Object.entries(counts)) {
      const info = priceMap.get(planId);
      const mrr = (info?.price_cents ?? 0) * count;
      mrrCents += mrr;
      revenueByPlan.push({ plan: info?.name ?? planId, count, mrr: mrr / 100 });
    }

    return {
      series: Array.from(buckets.values()),
      mrrBrl: mrrCents / 100,
      revenueByPlan,
    };
  });

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ search: z.string().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const period = new Date().toISOString().slice(0, 7);
    let q = supabaseAdmin.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }).limit(200);
    if (data.search) q = q.ilike("display_name", `%${data.search}%`);
    const { data: profiles, error } = await q;
    if (error) throw new Error(error.message);
    const ids = (profiles ?? []).map((p) => p.id);
    if (!ids.length) return { users: [] };

    const [subs, roles, usage, authList] = await Promise.all([
      supabaseAdmin.from("subscriptions").select("user_id, plan_id").in("user_id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin.from("usage_counters").select("user_id, searches, saved_leads").in("user_id", ids).eq("period", period),
      supabaseAdmin.auth.admin.listUsers({ perPage: 200 }),
    ]);
    const emailMap = new Map<string, string>();
    for (const u of authList.data.users ?? []) emailMap.set(u.id, u.email ?? "");

    return {
      users: (profiles ?? []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        email: emailMap.get(p.id) ?? "",
        created_at: p.created_at,
        plan_id: subs.data?.find((s) => s.user_id === p.id)?.plan_id ?? "gratuito",
        roles: (roles.data ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
        searches: usage.data?.find((u) => u.user_id === p.id)?.searches ?? 0,
        saved_leads: usage.data?.find((u) => u.user_id === p.id)?.saved_leads ?? 0,
      })),
    };
  });

export const adminSetUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid(), planId: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { auditLog } = await import("./security.server");
    const { error } = await supabaseAdmin.from("subscriptions").upsert({ user_id: data.userId, plan_id: data.planId, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    await auditLog(context.userId, "set_user_plan", data.userId, { planId: data.planId });
    return { ok: true };
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid(), role: z.enum(["admin", "user"]), grant: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { auditLog } = await import("./security.server");
    if (data.grant) {
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
      if (error && !String(error.message).includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    await auditLog(context.userId, data.grant ? "grant_role" : "revoke_role", data.userId, { role: data.role });
    return { ok: true };
  });

export const adminUpdatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      planId: z.string(),
      patch: z.object({
        name: z.string().optional(),
        max_categories: z.number().int().optional(),
        monthly_searches: z.number().int().optional(),
        monthly_saved_leads: z.number().int().optional(),
        detailed_search: z.boolean().optional(),
        price_cents: z.number().int().optional(),
      }),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("plans").update({ ...data.patch, updated_at: new Date().toISOString() }).eq("id", data.planId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      slug: z.string().min(1),
      label: z.string().min(1),
      min_plan: z.string(),
      active: z.boolean().default(true),
      sort_order: z.number().int().default(0),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("categories").upsert({ ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ slug: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("categories").delete().eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_audit_log")
      .select("id, actor_id, action, target_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const actorIds = Array.from(new Set((data ?? []).flatMap((r) => [r.actor_id, r.target_id]).filter(Boolean))) as string[];
    const emailMap = new Map<string, string>();
    if (actorIds.length) {
      const list = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
      for (const u of list.data.users ?? []) emailMap.set(u.id, u.email ?? "");
    }
    return {
      entries: (data ?? []).map((r) => ({
        ...r,
        actor_email: emailMap.get(r.actor_id) ?? r.actor_id,
        target_email: r.target_id ? emailMap.get(r.target_id) ?? r.target_id : null,
      })),
    };
  });
