import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  return proxyBackend(`/api/artifacts?id=${encodeURIComponent(id)}`);
}
