// Server-only security helpers (rate limit + audit log).
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function enforceRateLimit(
  userId: string,
  action: string,
  maxPerHour: number,
): Promise<void> {
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    _user_id: userId,
    _action: action,
    _max: maxPerHour,
  });
  if (error) {
    console.error("[rate_limit]", error);
    return; // fail-open to não travar por indisponibilidade
  }
  if (data === false) {
    throw new Error(
      `Limite de ${maxPerHour}/hora atingido para "${action}". Tente novamente mais tarde.`,
    );
  }
}

export async function auditLog(
  actorId: string,
  action: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabaseAdmin.from("admin_audit_log").insert({
    actor_id: actorId,
    action,
    target_id: targetId,
    metadata,
  });
  if (error) console.error("[audit_log]", error);
}
