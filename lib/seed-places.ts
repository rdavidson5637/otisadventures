import { config } from "dotenv";
import { PLACE_LONG_DESCRIPTIONS } from "./place-descriptions";
import { supabaseAdmin } from "./supabase";
import { slugify } from "./slug";
import type { PlaceCategory } from "@/types/otis";

config({ path: ".env.local" });

const TRIP = {
  name: "Northern Ireland 2026",
  description:
    "Otis' first big adventure — exploring the very best of Northern Ireland",
  cover_emoji: "🍀",
  start_date: "2026-07-10",
  end_date: "2026-07-23",
  location: "Northern Ireland",
  slug: "northern-ireland-2026",
  is_active: true,
};

const PLACES: {
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  location: string;
}[] = [
  { name: "Giant's Causeway", category: "nature", lat: 55.2408, lng: -6.5116, location: "County Antrim" },
  { name: "The Dark Hedges", category: "nature", lat: 55.1347, lng: -6.3808, location: "Ballymoney" },
  { name: "W5 Science Centre", category: "indoor", lat: 54.6047, lng: -5.9155, location: "Belfast" },
  { name: "Ulster Museum", category: "indoor", lat: 54.5824, lng: -5.9353, location: "Belfast" },
  { name: "Armagh Planetarium", category: "indoor", lat: 54.3519, lng: -6.6482, location: "Armagh" },
  { name: "Carrickfergus Castle", category: "castle", lat: 54.7137, lng: -5.8063, location: "Carrickfergus" },
  { name: "Castle Ward", category: "castle", lat: 54.3677, lng: -5.5805, location: "Strangford" },
  { name: "Whiterocks Beach", category: "beach", lat: 55.2073, lng: -6.6587, location: "Portrush" },
  { name: "Portstewart Strand", category: "beach", lat: 55.1689, lng: -6.7502, location: "Portstewart" },
  { name: "Drum Manor Forest Park", category: "nature", lat: 54.6429, lng: -6.8181, location: "Cookstown" },
  { name: "Murlough Nature Reserve", category: "beach", lat: 54.2341, lng: -5.8627, location: "Newcastle" },
  { name: "Crawfordsburn Country Park", category: "nature", lat: 54.6661, lng: -5.7287, location: "Bangor" },
  { name: "Belfast Zoo", category: "nature", lat: 54.6546, lng: -5.9427, location: "Belfast" },
  { name: "Exploris Aquarium", category: "indoor", lat: 54.3817, lng: -5.5489, location: "Portaferry" },
  { name: "WWT Castle Espie", category: "nature", lat: 54.5303, lng: -5.6962, location: "Comber" },
  { name: "Glenariff Forest Park", category: "nature", lat: 55.0223, lng: -6.1251, location: "Glenariff" },
  { name: "Seaforde Butterfly House", category: "nature", lat: 54.316, lng: -5.8399, location: "Seaforde" },
  { name: "Ark Open Farm", category: "farm", lat: 54.6163, lng: -5.679, location: "Newtownards" },
  { name: "Streamvale Open Farm", category: "farm", lat: 54.5801, lng: -5.8172, location: "Belfast" },
  { name: "Play Factore", category: "indoor", lat: 54.5964, lng: -5.9953, location: "Belfast" },
];

async function seed() {
  console.log("Seeding Northern Ireland 2026 trip...");

  const { data: existingTrip } = await supabaseAdmin
    .from("trips")
    .select("id")
    .eq("slug", TRIP.slug)
    .maybeSingle();

  let tripId: string;

  if (existingTrip) {
    tripId = existingTrip.id;
    console.log(`✓ Trip already exists (${tripId}), skipping insert`);
  } else {
    const { data, error } = await supabaseAdmin
      .from("trips")
      .insert(TRIP)
      .select("id")
      .single();

    if (error) {
      console.error("✗ Failed to insert trip:", error.message);
      process.exit(1);
    }

    tripId = data.id;
    console.log(`✓ Trip inserted: ${TRIP.name} (${tripId})`);
  }

  for (const place of PLACES) {
    const { data: existing } = await supabaseAdmin
      .from("places")
      .select("id")
      .eq("trip_id", tripId)
      .eq("name", place.name)
      .maybeSingle();

    if (existing) {
      console.log(`✓ Place already exists: ${place.name}`);
      continue;
    }

    const { error } = await supabaseAdmin.from("places").insert({
      trip_id: tripId,
      name: place.name,
      location: place.location,
      category: place.category,
      long_description: PLACE_LONG_DESCRIPTIONS[place.name] ?? null,
      lat: place.lat,
      lng: place.lng,
      visited: false,
    });

    if (error) {
      console.error(`✗ Failed to insert ${place.name}:`, error.message);
    } else {
      console.log(`✓ Place inserted: ${place.name}`);
    }
  }

  console.log("\nSeed complete!");
  console.log(`Trip slug: ${slugify(TRIP.name)}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
