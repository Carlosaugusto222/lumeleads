import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const credsSchema = z.object({
  access_token: z.string().trim().min(20).max(4000),
  phone_number_id: z.string().trim().regex(/^\d+$/, "somente números").max(64),
  business_account_id: z.string().trim().max(64).optional().or(z.literal("")),
  verify_token: z.string().trim().max(200).optional().or(z.literal("")),
  default_template_name: z.string().trim().max(120).optional().or(z.literal("")),
  default_template_language: z.string().trim().max(20).optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const getMyWhatsappCredentials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("whatsapp_credentials")
      .select("phone_number_id, business_account_id, verify_token, default_template_name, default_template_language, is_active, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const saveMyWhatsappCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => credsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      access_token: data.access_token,
      phone_number_id: data.phone_number_id,
      business_account_id: data.business_account_id || null,
      verify_token: data.verify_token || null,
      default_template_name: data.default_template_name || null,
      default_template_language: data.default_template_language || "pt_BR",
      is_active: data.is_active ?? true,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("whatsapp_credentials").upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });

export const deleteMyWhatsappCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("whatsapp_credentials").delete().eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

const sendSchema = z.object({
  to: z.string().trim().regex(/^\+?\d{8,20}$/, "telefone inválido (E.164, ex: +5511999999999)"),
  template_name: z.string().trim().min(1).max(120),
  template_language: z.string().trim().min(2).max(20).default("pt_BR"),
  variables: z.array(z.string().max(400)).max(20).optional(),
  lead_id: z.string().uuid().optional(),
});

export const sendWhatsappTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => sendSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: creds, error: credsErr } = await supabase
      .from("whatsapp_credentials")
      .select("access_token, phone_number_id, is_active")
      .eq("user_id", userId)
      .maybeSingle();
    if (credsErr) throw credsErr;
    if (!creds || !creds.is_active) throw new Error("Credenciais do WhatsApp não configuradas. Vá em /app/whatsapp.");

    const to = data.to.replace(/[^\d]/g, "");
    const components = data.variables && data.variables.length > 0
      ? [{
          type: "body",
          parameters: data.variables.map((v) => ({ type: "text", text: v })),
        }]
      : undefined;

    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: data.template_name,
        language: { code: data.template_language },
        ...(components ? { components } : {}),
      },
    };

    const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(creds.phone_number_id)}/messages`;
    let raw: unknown = null;
    let waId: string | null = null;
    let status = "sent";
    let errText: string | null = null;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      raw = await res.json().catch(() => ({}));
      if (!res.ok) {
        status = "error";
        errText = (raw as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
      } else {
        waId = (raw as { messages?: { id?: string }[] })?.messages?.[0]?.id ?? null;
      }
    } catch (e) {
      status = "error";
      errText = e instanceof Error ? e.message : "erro desconhecido";
    }

    await supabase.from("whatsapp_messages").insert({
      user_id: userId,
      lead_id: data.lead_id ?? null,
      to_phone: to,
      template_name: data.template_name,
      template_language: data.template_language,
      body_variables: data.variables ?? null,
      wa_message_id: waId,
      status,
      error: errText,
      raw_response: raw as never,
    });

    if (status === "error") throw new Error(errText || "Falha ao enviar WhatsApp");
    return { ok: true, wa_message_id: waId };
  });

export const listMyWhatsappMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("id, to_phone, template_name, status, error, wa_message_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });
