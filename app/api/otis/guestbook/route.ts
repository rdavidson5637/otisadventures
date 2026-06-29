import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { getFamilySessionFromRequest, isAdminSessionFromRequest } from "@/lib/family-auth";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("guestbook_entries")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return jsonError(error.message);
    return jsonOk(data ?? []);
  } catch {
    return jsonError("Failed to fetch guestbook");
  }
}

export async function POST(request: Request) {
  try {
    const session = await getFamilySessionFromRequest(request);
    if (!session) {
      return jsonError("Family login required", 401);
    }

    const body = await parseBody<{ message: string; photo_url?: string }>(request);
    if (!body?.message?.trim()) {
      return jsonError("message required", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("guestbook_entries")
      .insert({
        author_name: session.displayName,
        author_username: session.username,
        message: body.message.trim(),
        photo_url: body.photo_url ?? null,
      })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create guestbook entry");
  }
}
