import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  return proxyBackend(`/api/search${query ? `?${query}` : ""}`);
}
