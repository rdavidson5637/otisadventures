import { jsonOk } from "@/lib/api-utils";
import { getAdminNameFromRequest, isAdminSessionFromRequest } from "@/lib/family-auth";

export async function GET(request: Request) {
  const isAdmin = isAdminSessionFromRequest(request);
  return jsonOk({
    isAdmin,
    adminName: isAdmin ? getAdminNameFromRequest(request) : null,
  });
}
