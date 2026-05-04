// vite.config.ts — FILE COMPLETO
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      allowedHosts: [".ngrok-free.dev", ".trycloudflare.com"],
    },
  },
});