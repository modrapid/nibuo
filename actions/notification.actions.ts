"use server";

import { sendEmail } from "@/lib/email/sendEmail";
import { abuseReportAdminAlertTemplate } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";

// Called after a report is submitted, to alert admins immediately (supplements the admin panel)
export async function notifyAdminsOfReport(shortCode: string, reason: string) {
  const supabase = await createClient();
  const { data: admins } = await supabase.from("users").select("email").eq("role", "admin");

  if (!admins?.length) return;

  await Promise.all(
    admins.map((admin) =>
      sendEmail({
        to: admin.email,
        subject: `New abuse report — /${shortCode}`,
        html: abuseReportAdminAlertTemplate(shortCode, reason),
      })
    )
  );
}
