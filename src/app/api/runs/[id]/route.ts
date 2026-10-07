import { proxyBackend } from "@/lib/backend";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyBackend(`/api/runs/${encodeURIComponent(id)}`);
}
