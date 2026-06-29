import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const isAdmin = isAdminSessionFromRequest(request);

    let query = supabase.from("year_reviews").select("*").order("year", { ascending: false });
    if (!isAdmin) {
      query = query.eq("published", true);
    }

    const { data, error } = await query;
    if (error) return jsonError(error.message);
    return jsonOk(data ?? []);
  } catch {
    return jsonError("Failed to fetch year reviews");
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const body = await parseBody<{
      year: number;
      headline?: string;
      favourite_moment_id?: string;
      published?: boolean;
    }>(request);

    if (!body?.year) return jsonError("year required", 400);

    const { data, error } = await supabaseAdmin
      .from("year_reviews")
      .upsert(
        {
          year: body.year,
          headline: body.headline ?? null,
          favourite_moment_id: body.favourite_moment_id ?? null,
          published: body.published ?? false,
        },
        { onConflict: "year" }
      )
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to save year review");
  }
}
