import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabaseAdmin } from "@/lib/supabase";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("capsule_letters")
      .select("*")
      .eq("capsule_id", params.id);

    if (error) return jsonError(error.message);
    return jsonOk(data ?? []);
  } catch {
    return jsonError("Failed to fetch letters");
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const { data: capsule } = await supabaseAdmin
      .from("time_capsules")
      .select("unlock_date")
      .eq("id", params.id)
      .single();

    if (capsule && capsule.unlock_date <= todayStr()) {
      return jsonError("Capsule is unlocked — letters are read-only", 403);
    }

    const body = await parseBody<{
      author: string;
      letter_text?: string;
      photo_url?: string;
    }>(request);

    if (!body?.author) return jsonError("author required", 400);

    const { data: existing } = await supabaseAdmin
      .from("capsule_letters")
      .select("id")
      .eq("capsule_id", params.id)
      .eq("author", body.author)
      .maybeSingle();

    const letterData = {
      capsule_id: params.id,
      author: body.author,
      letter_text: body.letter_text ?? null,
      photo_url: body.photo_url ?? null,
      last_edited: new Date().toISOString(),
    };

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("capsule_letters")
        .update(letterData)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return jsonError(error.message);
      return jsonOk(data);
    }

    const { data, error } = await supabaseAdmin
      .from("capsule_letters")
      .insert(letterData)
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to save letter");
  }
}
