import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const LEAD_STATUSES = ["base", "abordado", "agendado", "follow_up", "convertido", "perdido"] as const;
const LEAD_TIERS = ["frio", "morno", "quente"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadTier = (typeof LEAD_TIERS)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  base: "Base",
  abordado: "Abordado",
  agendado: "Agendado",
  follow_up: "Follow Up",
  convertido: "Convertido",
  perdido: "Perdido",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [...LEAD_STATUSES];

const leadInput = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(120).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  state: z.string().max(80).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  address: z.string().max(400).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  website: z.string().max(400).optional().nullable(),
  has_website: z.boolean().optional(),
  score: z.number().int().min(0).max(100).optional(),
  tier: z.enum(LEAD_TIERS).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.string().max(120).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  rating: z.number().optional().nullable(),
  reviews_count: z.number().int().optional().nullable(),
});

export type LeadInput = z.infer<typeof leadInput>;

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => leadInput.parse(i))
  .handler(async ({ data, context }) => {
    const insert: Database["public"]["Tables"]["leads"]["Insert"] = {
      user_id: context.userId,
      name: data.name,
      category: data.category ?? null,
      country: data.country ?? "Brasil",
      state: data.state ?? null,
      city: data.city ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      website: data.website ?? null,
      has_website: data.has_website ?? Boolean(data.website),
      score: data.score ?? 0,
      tier: data.tier ?? "frio",
      status: data.status ?? "base",
      source: data.source ?? "manual",
      notes: data.notes ?? null,
      rating: data.rating ?? null,
      reviews_count: data.reviews_count ?? null,
    };
    const { data: row, error } = await context.supabase.from("leads").insert(insert).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), patch: leadInput.partial() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("leads").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(LEAD_STATUSES) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("leads").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkImportLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ leads: z.array(leadInput).min(1).max(1000) }).parse(i))
  .handler(async ({ data, context }) => {
    const rows: Database["public"]["Tables"]["leads"]["Insert"][] = data.leads.map((l) => ({
      user_id: context.userId,
      name: l.name,
      category: l.category ?? null,
      country: l.country ?? "Brasil",
      state: l.state ?? null,
      city: l.city ?? null,
      address: l.address ?? null,
      phone: l.phone ?? null,
      email: l.email ?? null,
      website: l.website ?? null,
      has_website: l.has_website ?? Boolean(l.website),
      score: l.score ?? 0,
      tier: l.tier ?? "frio",
      status: l.status ?? "base",
      source: l.source ?? "csv",
      notes: l.notes ?? null,
    }));
    const { error, count } = await context.supabase.from("leads").insert(rows, { count: "exact" });
    if (error) throw new Error(error.message);
    return { inserted: count ?? rows.length };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("leads").select("status,has_website");
    if (error) throw new Error(error.message);
    const counts: Record<LeadStatus, number> = {
      base: 0, abordado: 0, agendado: 0, follow_up: 0, convertido: 0, perdido: 0,
    };
    let withSite = 0;
    for (const l of data ?? []) {
      counts[l.status as LeadStatus]++;
      if (l.has_website) withSite++;
    }
    const total = data?.length ?? 0;
    return { counts, total, withSite, withoutSite: total - withSite };
  });
