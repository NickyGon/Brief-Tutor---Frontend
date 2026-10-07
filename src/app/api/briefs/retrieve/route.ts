import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend";

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend("/api/briefs/retrieve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
