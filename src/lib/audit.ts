import { db } from "@/lib/db";

// Best-effort logging: a write to the audit table failing should never
// block the admin action it's recording.
export async function logAdminAction(params: { adminEmail: string; action: string; targetType: string; targetId: string; detail?: string }) {
  try {
    await db.adminAuditLog.create({
      data: {
        adminEmail: params.adminEmail,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        detail: params.detail,
      },
    });
  } catch (err) {
    console.error("Failed to write admin audit log", err);
  }
}
