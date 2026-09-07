import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_")
  const backendUrl = env.VITE_DEV_BACKEND_URL

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      host: "127.0.0.1",
      port: 27526,
      strictPort: true,
      proxy: backendUrl
        ? {
            "/api": { target: backendUrl, changeOrigin: true },
            "/callback": { target: backendUrl, changeOrigin: true },
            "/healthz": { target: backendUrl, changeOrigin: true },
            "/readyz": { target: backendUrl, changeOrigin: true },
          }
        : undefined,
    },
  }
})
