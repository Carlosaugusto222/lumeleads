import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLAN_PRICES: Record<string, { monthly: number; yearly: number; name: string }> = {
  starter: { monthly: 47, yearly: 33, name: "Starter" },
  pro: { monthly: 97, yearly: 68, name: "Pro" },
  agencia: { monthly: 197, yearly: 138, name: "Agência" },
  elite: { monthly: 197, yearly: 138, name: "Elite" },
};

const CheckoutInput = z.object({
  planId: z.enum(["starter", "pro", "agencia", "elite"]),
  cycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const createMpCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CheckoutInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    const normalizedPlanId = data.planId === "elite" ? "agencia" : data.planId;
    const priceCfg = PLAN_PRICES[data.planId] ?? PLAN_PRICES[normalizedPlanId];
    const unitPrice = data.cycle === "yearly" ? priceCfg.yearly : priceCfg.monthly;
    const amountCents = unitPrice * 100;

    // Build return URLs from request origin
    const req = getRequest();
    const reqOrigin = req?.headers.get("origin") ?? new URL(req?.url ?? "http://localhost").origin;
    // Mercado Pago rejects http back_urls (and requires https for auto_return).
    // Fall back to the published URL when running on localhost/preview.
    const publicOrigin = process.env.PUBLIC_APP_URL ?? "https://lumeleads.lovable.app";
    const origin = reqOrigin.startsWith("https://") ? reqOrigin : publicOrigin;

    const email = (claims as { email?: string })?.email ?? undefined;
    const externalRef = `${userId}:${normalizedPlanId}:${data.cycle}:${Date.now()}`;

    const body = {
      items: [
        {
          id: normalizedPlanId,
          title: `LumeLeads ${priceCfg.name} (${data.cycle === "yearly" ? "anual" : "mensal"})`,
          quantity: 1,
          unit_price: unitPrice,
          currency_id: "BRL",
        },
      ],
      payer: email ? { email } : undefined,
      back_urls: {
        success: `${origin}/app/billing/success`,
        failure: `${origin}/app/billing?status=failure`,
        pending: `${origin}/app/billing?status=pending`,
      },
      auto_return: "approved",
      external_reference: externalRef,
      notification_url: `${origin}/api/public/mp-webhook`,
      metadata: { user_id: userId, plan_id: normalizedPlanId, cycle: data.cycle },
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
      message?: string;
    };

    if (!res.ok || !json.id) {
      throw new Error(json.message ?? "Falha ao criar preferência no Mercado Pago");
    }

    const initPoint = json.init_point ?? json.sandbox_init_point;
    if (!initPoint) {
      throw new Error("Link de pagamento não retornado pelo Mercado Pago");
    }

    await supabase.from("payments").insert({
      user_id: userId,
      plan_id: normalizedPlanId,
      cycle: data.cycle,
      amount_cents: amountCents,
      currency: "BRL",
      status: "pending",
      provider: "mercadopago",
      mp_preference_id: json.id,
      init_point: initPoint,
      raw: json as never,
    });

    return { initPoint, preferenceId: json.id };
  });

export const listMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("payments")
      .select("id, plan_id, cycle, amount_cents, status, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });
