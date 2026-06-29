import { logAdminActivity } from "@/lib/activity-log";
import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { slugify } from "@/lib/slug";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch trips");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{
      name: string;
      description?: string;
      cover_emoji?: string;
      start_date?: string;
      end_date?: string;
      location?: string;
      centre_lat?: number;
      centre_lng?: number;
      is_active?: boolean;
      admin_name?: string;
    }>(request);

    if (!body?.name) return jsonError("Name required", 400);

    const slug = slugify(body.name);
    const { data, error } = await supabaseAdmin
      .from("trips")
      .insert({
        name: body.name,
        description: body.description ?? null,
        cover_emoji: body.cover_emoji ?? null,
        start_date: body.start_date ?? null,
        end_date: body.end_date ?? null,
        location: body.location ?? null,
        centre_lat: body.centre_lat ?? null,
        centre_lng: body.centre_lng ?? null,
        slug,
        is_active: body.is_active ?? false,
      })
      .select()
      .single();

    if (error) return jsonError(error.message);

    if (body.admin_name) {
      await logAdminActivity(
        body.admin_name,
        `created a new trip: ${body.name}`,
        "trip",
        data.id,
        body.name
      );
    }

    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create trip");
  }
}
