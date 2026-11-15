import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { handleSpeechRequest } from "./server/speechService.js";

// The private narration route works in local Vite development. On a Vercel
// deployment the matching api/tts.ts function handles the same route.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      tailwindcss(),
      react(),
      {
        name: "pathfinder-narration",
        configureServer(server) {
          server.middlewares.use("/api/tts", (request, response, next) => {
            if (request.method !== "POST") { next(); return; }
            void handleSpeechRequest(request, response, env.OPENAI_API_KEY, env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts");
          });
        },
      },
    ],
  };
});
