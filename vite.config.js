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

      manifest: {
        name: "CampusMart 2.0",
        short_name: "CampusMart",
        description:
          "Shop products from verified campus sellers, post or apply for campus gigs, and enjoy secure Paystack payments.",
        theme_color: "#008236",
        background_color: "#ffffff",

        display: "standalone",

        orientation: "portrait",

        scope: "/",

        start_url: "/app-start",

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Default Workbox precache limit is 2 MB, which our main JS
        // bundle exceeded. Raising this stops the build from failing
        // with a PLUGIN_ERROR at the vite-plugin-pwa:build step.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      },
    }),
  ],

  build: {
    rollupOptions: {
      output: {
        // This project builds with rolldown-vite, and Rolldown's
        // manualChunks only accepts a FUNCTION (id) => chunkName,
        // unlike regular Vite/Rollup which also accepts a plain
        // object map. Passing an object here is what caused
        // "TypeError: manualChunks is not a function".
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