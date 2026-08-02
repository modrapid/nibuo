"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidEmail, isValidPassword } from "@/lib/validations/auth";

export async function signUp(email: string, password: string) {
  if (!isValidEmail(email)) return { error: "Invalid email address." };
  if (!isValidPassword(password)) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  return { data };
}

export async function signIn(email: string, password: string) {
  if (!isValidEmail(email)) return { error: "Invalid email address." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Invalid email or password." };
  return { data };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}

export async function requestPasswordReset(email: string) {
  if (!isValidEmail(email)) return { error: "Invalid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePassword(newPassword: string) {
  if (!isValidPassword(newPassword)) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { error: error.message };
  return { success: true };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
