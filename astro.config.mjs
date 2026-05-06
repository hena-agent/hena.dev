// @ts-check

import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 4321,
    host: process.env.HOST ?? "127.0.0.1",
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [
        "hena-dev.localhost",
        ".pug-mohs.ts.net",
      ],
    },
  },
  integrations: [react()],
})
