const API_BASE = process.env.BRIEF_TUTOR_API_URL ?? "http://127.0.0.1:8000";

export async function proxyBackend(path: string, init?: RequestInit) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      cache: "no-store",
    });
    const text = await response.text();
    return new Response(text || "{}", {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      {
        error:
          "Brief Tutor API is not running. From the Brief Tutor folder, start it with py -3.13 -m uvicorn api.server:app --host 127.0.0.1 --port 8000.",
      },
      { status: 503 },
    );
  }
}
