import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "xbare.top — Fast, Secure File Sharing",
  description: "Send files instantly with password protection, auto-expiry, and download tracking. No sign-up required.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://xbare.top"),
  openGraph: {
    title: "xbare.top — Fast, Secure File Sharing",
    description: "Send files instantly. No sign-up required.",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value ?? "light";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={theme === "dark" ? "dark" : ""}>
      <body>
        <Navbar user={user} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
