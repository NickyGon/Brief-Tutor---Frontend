import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend";

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
