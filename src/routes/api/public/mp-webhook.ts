import { createFileRoute } from "@tanstack/react-router";

const PLAN_ORDER = ["gratuito", "starter", "pro", "agencia", "business"];

async function handle(request: Request) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  const url = new URL(request.url);
  const topic = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? null;
  const resourceId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? null;

  let bodyText = "";
  try { bodyText = await request.text(); } catch {}
  let payload: Record<string, unknown> = {};
  try { payload = bodyText ? JSON.parse(bodyText) : {}; } catch {}

  const paymentId =
    resourceId ??
    (typeof (payload as { data?: { id?: string } }).data?.id === "string"
      ? (payload as { data: { id: string } }).data.id
      : null);

  const { data: logRow } = await supabaseAdmin
    .from("mp_webhook_logs")
    .insert({ topic, resource_id: paymentId, payload: (payload ?? {}) as never, status: "received" })
    .select("id")
    .single();

  const finish = async (status: string, error?: string) => {
    if (logRow?.id) {
      await supabaseAdmin
        .from("mp_webhook_logs")
        .update({ status, error: error ?? null })
        .eq("id", logRow.id);
    }
    return new Response("ok", { status: 200 });
  };

  if (!token) return finish("skipped", "no_token");
  if ((topic ?? "").toString() !== "payment" || !paymentId) return finish("ignored");

  // Fetch payment detail from Mercado Pago
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return finish("error", `mp_fetch_${res.status}`);
  const payment = (await res.json()) as {
    id: number;
    status: string;
    external_reference?: string;
    preference_id?: string;
    metadata?: { user_id?: string; plan_id?: string; cycle?: string };
    transaction_amount?: number;
  };

  const userId = payment.metadata?.user_id ?? payment.external_reference?.split(":")[0];
  const planId = payment.metadata?.plan_id ?? payment.external_reference?.split(":")[1];

  if (!userId || !planId) return finish("error", "missing_ref");

  // Update payment row (match by preference or insert if unknown)
  const update = {
    status: payment.status,
    mp_payment_id: String(payment.id),
    raw: payment as never,
  };
  if (payment.preference_id) {
    await supabaseAdmin.from("payments").update(update).eq("mp_preference_id", payment.preference_id);
  }

  if (payment.status === "approved") {
    // Only upgrade if the new plan rank >= current
    const { data: current } = await supabaseAdmin
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", userId)
      .maybeSingle();
    const currentRank = PLAN_ORDER.indexOf(current?.plan_id ?? "gratuito");
    const newRank = PLAN_ORDER.indexOf(planId);
    if (newRank > currentRank) {
      await supabaseAdmin
        .from("subscriptions")
        .upsert({ user_id: userId, plan_id: planId, updated_at: new Date().toISOString() });
    }
    return finish("processed");
  }

  return finish("processed");
}

export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
      GET: async ({ request }) => handle(request),
    },
  },
});
