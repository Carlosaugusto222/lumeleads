import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { enforceRateLimit } = await import("./security.server");
    await enforceRateLimit(context.userId, "data_export", 5);
    const s = context.supabase;
    const uid = context.userId;
    const [profile, leads, sites, submissions, appointments, subscription, usage, roles, notifications] =
      await Promise.all([
        s.from("profiles").select("*").eq("id", uid).maybeSingle(),
        s.from("leads").select("*").eq("user_id", uid),
        s.from("sites").select("*").eq("user_id", uid),
        s.from("site_submissions").select("*"),
        s.from("appointments").select("*").eq("user_id", uid),
        s.from("subscriptions").select("*").eq("user_id", uid).maybeSingle(),
        s.from("usage_counters").select("*").eq("user_id", uid),
        s.from("user_roles").select("role").eq("user_id", uid),
        s.from("notifications").select("*").eq("user_id", uid),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      userId: uid,
      email: context.claims?.email ?? null,
      profile: profile.data ?? null,
      roles: (roles.data ?? []).map((r: any) => r.role),
      subscription: subscription.data ?? null,
      usage: usage.data ?? [],
      leads: leads.data ?? [],
      sites: sites.data ?? [],
      siteSubmissions: submissions.data ?? [],
      appointments: appointments.data ?? [],
      notifications: notifications.data ?? [],
    };
  });
