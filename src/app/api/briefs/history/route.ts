import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const spreadsheetPath = request.nextUrl.searchParams.get("spreadsheetPath") ?? "";
  return proxyBackend(`/api/briefs/history?spreadsheetPath=${encodeURIComponent(spreadsheetPath)}`);
}
