import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      devOptions: {
        enabled: true,
      },

      injectRegister: "auto",

      manifest: {
        id: "/",
        name: "CampusMart 2.0",
        short_name: "CampusMart",
        description:
          "Shop products from verified campus sellers, post or apply for campus gigs, and enjoy secure Paystack payments.",
        theme_color: "#008236",
        background_color: "#ffffff",

        // standalone = no address bar
        // window-controls-overlay = your content draws into the title bar area
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone", "minimal-ui"],

        orientation: "portrait",
        scope: "/",
        start_url: "/app-start",

        lang: "en",
        dir: "ltr",
        categories: ["shopping", "lifestyle", "education"],

        icons: [
  {
    src: "/pwa-192x192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/pwa-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/pwa-512x512-maskable.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
],

        prefer_related_applications: false,
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      },
    }),
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("firebase")) {
            return "firebase";
          }

          if (
            id.includes("react-router-dom") ||
            id.includes("/react-dom/") ||
            id.includes("/react/")
          ) {
            return "vendor";
          }
        },
      },
    },
  },
});