import { createClient } from "@/lib/supabase/server";

interface PlanLimits {
  maxFileSizeBytes: number;
  maxFileSizeLabel: string;
  storageLimitBytes: number;
}

const FREE_LIMITS: PlanLimits = {
  maxFileSizeBytes: 1 * 1024 * 1024 * 1024, // 1GB
  maxFileSizeLabel: "1GB",
  storageLimitBytes: 2 * 1024 * 1024 * 1024, // 2GB
};

export async function getPlanLimits(userId: string | null): Promise<PlanLimits> {
  if (!userId) return FREE_LIMITS;

  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("plan_id, plan_expires_at")
    .eq("id", userId)
    .single();

  if (!userRow?.plan_id) return FREE_LIMITS;
  if (userRow.plan_expires_at && new Date(userRow.plan_expires_at) < new Date()) return FREE_LIMITS;

  const { data: plan } = await supabase
    .from("plans")
    .select("max_file_size_gb, storage_limit_gb")
    .eq("id", userRow.plan_id)
    .single();

  if (!plan) return FREE_LIMITS;

  return {
    maxFileSizeBytes: plan.max_file_size_gb * 1024 * 1024 * 1024,
    maxFileSizeLabel: `${plan.max_file_size_gb}GB`,
    storageLimitBytes: plan.storage_limit_gb * 1024 * 1024 * 1024,
  };
}
