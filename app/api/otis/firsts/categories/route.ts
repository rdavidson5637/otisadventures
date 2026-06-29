import { jsonError, jsonOk, parseBody } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("firsts_categories")
      .select("*")
      .order("name");

    if (error) return jsonError(error.message);
    return jsonOk(data);
  } catch {
    return jsonError("Failed to fetch categories");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody<{ name: string; emoji: string }>(request);

    if (!body?.name || !body?.emoji) {
      return jsonError("name and emoji required", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("firsts_categories")
      .insert({ name: body.name, emoji: body.emoji })
      .select()
      .single();

    if (error) return jsonError(error.message);
    return jsonOk(data, 201);
  } catch {
    return jsonError("Failed to create category");
  }
}
