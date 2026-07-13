import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", userId)
      .maybeSingle();

    const { data: sent } = await supabase
      .from("referrals")
      .select("id, referred_id, status, reward_credits, created_at, converted_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    const { data: received } = await supabase
      .from("referrals")
      .select("id, referrer_id, status, created_at")
      .eq("referred_id", userId)
      .maybeSingle();

    const ids = Array.from(new Set((sent ?? []).map((r) => r.referred_id)));
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.display_name ?? ""]));
    }

    const referrals = (sent ?? []).map((r) => ({
      id: r.id,
      name: names[r.referred_id] || "Novo usuário",
      status: r.status,
      reward_credits: r.reward_credits,
      created_at: r.created_at,
      converted_at: r.converted_at,
    }));

    const totals = {
      total: referrals.length,
      converted: referrals.filter((r) => r.status === "converted").length,
      credits: referrals.reduce((s, r) => s + (r.reward_credits ?? 0), 0),
    };

    return {
      code: profile?.referral_code ?? "",
      referrals,
      totals,
      appliedReferrerId: received?.referrer_id ?? null,
    };
  });

export const applyReferralCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ code: z.string().trim().min(4).max(16) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const code = data.code.toUpperCase();

    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_id", userId)
      .maybeSingle();
    if (existing) throw new Error("Você já usou um código de indicação.");

    const { data: referrer } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!referrer) throw new Error("Código inválido.");
    if (referrer.id === userId) throw new Error("Você não pode indicar a si mesmo.");

    const { error } = await supabase
      .from("referrals")
      .insert({ referrer_id: referrer.id, referred_id: userId, status: "pending" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
