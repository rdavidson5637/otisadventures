import { supabase } from "@/lib/supabase";
import { OTIS_DOB } from "@/lib/otis-constants";
import OtisPageClient from "@/components/otis/OtisPageClient";
import type { FirstsCategory, GrowthEntry, OtisFirstWithCategory } from "@/types/otis";

async function getInitialData() {
  const [growthRes, settingsRes, firstsRes, categoriesRes] = await Promise.all([
    supabase.from("growth_entries").select("*").order("measured_date", { ascending: true }),
    supabase.from("otis_settings").select("*"),
    supabase
      .from("otis_firsts")
      .select("*, firsts_categories(*)")
      .order("date", { ascending: false }),
    supabase.from("firsts_categories").select("*").order("name"),
  ]);

  const settings: Record<string, string> = {};
  for (const row of settingsRes.data ?? []) {
    settings[row.key] = row.value;
  }

  const firsts: OtisFirstWithCategory[] = (firstsRes.data ?? []).map((f) => ({
    ...f,
    category: f.firsts_categories ?? null,
    firsts_categories: undefined,
  }));

  return {
    growthEntries: (growthRes.data ?? []) as GrowthEntry[],
    dob: OTIS_DOB,
    firsts,
    categories: (categoriesRes.data ?? []) as FirstsCategory[],
  };
}

export default async function AboutOtisPage() {
  const data = await getInitialData();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8 text-center">
        <h1 className="font-caveat text-5xl font-bold text-navy md:text-6xl">
          All About Otis 👶
        </h1>
      </header>
      <OtisPageClient {...data} />
    </main>
  );
}
