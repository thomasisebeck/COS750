import type { IncomingMessage, ServerResponse } from "node:http";

/** Server-only speech bridge. The provider key is never sent to a student's browser. */
export async function handleSpeechRequest(
  request: IncomingMessage & { body?: unknown },
  response: ServerResponse,
  apiKey?: string,
  model = "gpt-4o-mini-tts",
): Promise<void> {
  const reply = (status: number, message: string) => {
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(JSON.stringify({ error: message }));
  };

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    reply(405, "Use POST for narration.");
    return;
  }

  // In a static deployment or without a configured server-side credential,
  // the client falls back to the best voice installed on the user's device.
  if (!apiKey) { reply(503, "Natural voice is not configured."); return; }

  try {
    let body: unknown = request.body;
    if (typeof body === "string") body = JSON.parse(body);
    if (!body || typeof body !== "object") {
      let input = "";
      for await (const chunk of request) {
        input += String(chunk);
        if (input.length > 4500) { reply(413, "Narration text is too long."); return; }
      }
      body = JSON.parse(input);
    }
    const text = (body as { text?: unknown }).text;
    if (typeof text !== "string" || text.trim().length === 0 || text.length > 3000) {
      reply(400, "Narration must contain between 1 and 3000 characters.");
      return;
    }

    const provider = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice: "marin",
        input: text.trim(),
        instructions: "Speak like a warm, clear university tutor. Natural conversational pacing, friendly without exaggeration. Pronounce Dijkstra as Dike-stra. Leave a short pause between sentences.",
        response_format: "mp3",
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!provider.ok) { reply(502, "Natural voice service is unavailable."); return; }
    const bytes = Buffer.from(await provider.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 5_000_000) {
      reply(502, "Unexpected narration audio response.");
      return;
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "audio/mpeg");
    response.setHeader("Cache-Control", "private, max-age=600");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.end(bytes);
  } catch {
    // Don't expose provider errors, credentials or raw upstream responses.
    reply(502, "Unable to generate narration.");
  }
}
