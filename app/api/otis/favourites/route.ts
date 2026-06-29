import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const isCurrent = url.searchParams.get("is_current");

    let query = supabase.from("favourite_things").select("*").order("date_logged", {
      ascending: false,
    });

    if (category) query = query.eq("category", category);
    if (isCurrent === "true") query = query.eq("is_current", true);

    const { data, error } = await query;
    if (error) return jsonError(error.message);
    return jsonOk(data ?? []);
  } catch {
    return jsonError("Failed to fetch favourites");
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const body = await parseBody<{
      category: string;
      value: string;
      note?: string;
      date_logged: string;
      photo_url?: string;
      is_current?: boolean;
    }>(request);

    if (!body?.category || !body?.value || !body?.date_logged) {
      return jsonError("category, value, and date_logged required", 400);
    }

    const isCurrent = body.is_current !== false;

    if (isCurrent) {
      await supabaseAdmin
        .from("favourite_things")
        .update({ is_current: false })
        .eq("category", body.category)
        .eq("is_current", true);
    }

    const { data, error } = await supabaseAdmin
      .from("favourite_things")
      .insert({
        category: body.category,
        value: body.value,
        note: body.note ?? null,
        date_logged: body.date_logged,
        photo_url: body.photo_url ?? null,
        is_current: isCurrent,
      })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create favourite");
  }
}
