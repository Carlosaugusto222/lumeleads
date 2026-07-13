// Server-only helper to create in-app notifications.
// Uses the admin client to bypass RLS (system-generated messages).
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type NotifyInput = {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string | null;
};

export async function notifyUser({ userId, title, message, type = "info", link = null }: NotifyInput) {
  try {
    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      link,
    });
    if (error) console.error("[notify] insert failed:", error.message);
  } catch (e) {
    console.error("[notify] unexpected:", e);
  }
}
