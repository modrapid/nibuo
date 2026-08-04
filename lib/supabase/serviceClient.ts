import { createClient } from "@supabase/supabase-js";

// Bypasses RLS for trusted server-side operations only (counter increments, admin actions).
// NEVER import this into client components or expose the service role key to the browser.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
