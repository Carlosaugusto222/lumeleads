import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APPT_STATUSES = ["pendente", "concluido", "cancelado"] as const;
export type AppointmentStatus = (typeof APPT_STATUSES)[number];

const apptInput = z.object({
  lead_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).optional().nullable(),
  location: z.string().max(400).optional().nullable(),
  starts_at: z.string(),
  duration_min: z.number().int().min(5).max(1440).optional(),
  status: z.enum(APPT_STATUSES).optional(),
});

export const listAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("appointments")
      .select("*, leads(id, name, phone)")
      .order("starts_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const createAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => apptInput.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("appointments").insert({
      user_id: context.userId,
      lead_id: data.lead_id ?? null,
      title: data.title,
      notes: data.notes ?? null,
      location: data.location ?? null,
      starts_at: data.starts_at,
      duration_min: data.duration_min ?? 30,
      status: data.status ?? "pendente",
    });
    if (error) throw new Error(error.message);
    const when = new Date(data.starts_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    const { notifyUser } = await import("./notify.server");
    await notifyUser({
      userId: context.userId,
      title: "Agendamento criado",
      message: `${data.title} — ${when}`,
      type: "info",
      link: "/app/agenda",
    });
    return { ok: true };
  });

export const updateAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), status: z.enum(APPT_STATUSES) }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("appointments").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("appointments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
