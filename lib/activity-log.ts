import { supabaseAdmin } from "@/lib/supabase";

export async function logAdminActivity(
  adminName: string,
  action: string,
  entityType?: string,
  entityId?: string,
  entityName?: string
): Promise<void> {
  try {
    await supabaseAdmin.from("admin_activity").insert({
      admin_name: adminName,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      entity_name: entityName ?? null,
    });
  } catch (err) {
    console.error("Failed to log admin activity:", err);
  }
}
