import bcrypt from "bcryptjs";
import { jsonError, jsonOk } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  try {
    const { count, error: countError } = await supabaseAdmin
      .from("admins")
      .select("*", { count: "exact", head: true });

    if (countError) return jsonError(countError.message);

    if (count && count > 0) {
      return jsonOk({ success: false, message: "Admins already seeded" });
    }

    const dadPassword = process.env.DAD_PASSWORD;
    const mumPassword = process.env.MUM_PASSWORD;

    if (!dadPassword || !mumPassword) {
      return jsonError("DAD_PASSWORD and MUM_PASSWORD must be set", 500);
    }

    const [dadHash, mumHash] = await Promise.all([
      bcrypt.hash(dadPassword, 10),
      bcrypt.hash(mumPassword, 10),
    ]);

    const { error } = await supabaseAdmin.from("admins").insert([
      { username: "dad", name: "Dad", password_hash: dadHash },
      { username: "mum", name: "Mum", password_hash: mumHash },
    ]);

    if (error) return jsonError(error.message);

    return jsonOk({ success: true, message: "Seeded Dad and Mum admin accounts" });
  } catch {
    return jsonError("Failed to seed admins");
  }
}
