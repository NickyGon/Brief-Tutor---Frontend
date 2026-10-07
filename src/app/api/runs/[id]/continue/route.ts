import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return proxyBackend(`/api/runs/${encodeURIComponent(id)}/continue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
