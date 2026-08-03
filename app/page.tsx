import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/features/landing/HeroSection";
import { FeatureSection } from "@/components/features/landing/FeatureSection";
import { PricingSection } from "@/components/features/landing/PricingSection";
import { FaqSection } from "@/components/features/landing/FaqSection";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price_usd", { ascending: true });

  return (
    <main>
      <HeroSection />
      <FeatureSection />
      <PricingSection plans={plans ?? []} />
      <FaqSection />
    </main>
  );
}
