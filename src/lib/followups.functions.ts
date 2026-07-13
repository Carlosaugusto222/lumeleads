import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CHANNELS = ["whatsapp", "email"] as const;
const STATUSES = ["base", "abordado", "agendado", "follow_up", "convertido", "perdido"] as const;
const TASK_STATUSES = ["pending", "sent", "cancelled", "failed"] as const;

export type FollowupChannel = (typeof CHANNELS)[number];
export type FollowupTaskStatus = (typeof TASK_STATUSES)[number];

const templateInput = z.object({
  name: z.string().trim().min(1).max(120),
  channel: z.enum(CHANNELS),
  trigger_status: z.enum(STATUSES),
  delay_hours: z.number().int().min(0).max(24 * 90),
  subject: z.string().max(200).optional().nullable(),
  body: z.string().trim().min(1).max(4000),
  enabled: z.boolean().optional(),
});

// ---------------- Templates ----------------

export const listFollowupTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("follow_up_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createFollowupTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => templateInput.parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("follow_up_templates")
      .insert({ ...data, user_id: context.userId, enabled: data.enabled ?? true })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateFollowupTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), patch: templateInput.partial() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("follow_up_templates")
      .update(data.patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFollowupTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("follow_up_templates")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Tasks ----------------

function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

export const scheduleFollowupsForLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ leadId: z.string().uuid(), status: z.enum(STATUSES) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: lead, error: leadErr } = await context.supabase
      .from("leads")
      .select("id,name,phone,email,city,category")
      .eq("id", data.leadId)
      .maybeSingle();
    if (leadErr) throw new Error(leadErr.message);
    if (!lead) return { scheduled: 0 };

    const { data: templates, error: tErr } = await context.supabase
      .from("follow_up_templates")
      .select("*")
      .eq("trigger_status", data.status)
      .eq("enabled", true);
    if (tErr) throw new Error(tErr.message);
    if (!templates || templates.length === 0) return { scheduled: 0 };

    const vars = {
      nome: lead.name ?? "",
      cidade: lead.city ?? "",
      categoria: lead.category ?? "",
    };
    const now = Date.now();
    const rows = templates.map((t) => ({
      user_id: context.userId,
      lead_id: lead.id,
      template_id: t.id,
      channel: t.channel,
      subject: t.subject ? renderTemplate(t.subject, vars) : null,
      body: renderTemplate(t.body, vars),
      scheduled_for: new Date(now + t.delay_hours * 3600 * 1000).toISOString(),
      status: "pending" as const,
    }));
    const { error } = await context.supabase.from("follow_up_tasks").insert(rows);
    if (error) throw new Error(error.message);
    return { scheduled: rows.length };
  });

export const listFollowupTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({ status: z.enum(TASK_STATUSES).optional() })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("follow_up_tasks")
      .select("*, leads(name, phone, email, city, category)")
      .order("scheduled_for", { ascending: true })
      .limit(500);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows;
  });

export const setFollowupTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(TASK_STATUSES),
        error: z.string().max(500).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      status: FollowupTaskStatus;
      sent_at?: string;
      error?: string | null;
    } = { status: data.status };
    if (data.status === "sent") patch.sent_at = new Date().toISOString();
    if (data.error !== undefined) patch.error = data.error;
    const { error } = await context.supabase
      .from("follow_up_tasks")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const deleteFollowupTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("follow_up_tasks")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
