import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("feed_event_types")
      .select("*")
      .order("name");

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch event types");
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const body = await parseBody<{ name?: string; emoji?: string; colour?: string }>(request);
    if (!body?.name || !body?.emoji || !body?.colour) {
      return jsonError("name, emoji, and colour required", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("feed_event_types")
      .insert({
        name: body.name,
        emoji: body.emoji,
        colour: body.colour,
      })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create event type");
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAdminSessionFromRequest(request)) {
      return jsonError("Admin access required", 401);
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return jsonError("id required", 400);

    const { error } = await supabaseAdmin.from("feed_event_types").delete().eq("id", id);
    if (error) return jsonError(error.message);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete event type");
  }
}
