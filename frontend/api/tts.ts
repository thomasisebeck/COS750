import type { IncomingMessage, ServerResponse } from "node:http";
import { handleSpeechRequest } from "../server/speechService.js";

/** Vercel-compatible serverless endpoint for secure narration. */
export default function handler(
  request: IncomingMessage & { body?: unknown },
  response: ServerResponse,
) {
  void handleSpeechRequest(request, response, process.env.OPENAI_API_KEY, process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts");
}
