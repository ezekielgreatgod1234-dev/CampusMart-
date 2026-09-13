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
        // bundle exceeds. Raising this stops the build from failing
        // with a PLUGIN_ERROR at the vite-plugin-pwa:build step.
        // Still worth watching this number over time — if it keeps
        // climbing, the manualChunks split below needs more buckets.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      },
    }),
  ],

  build: {
    rollupOptions: {
      output: {
        // Splits big third-party libraries into their own chunks
        // instead of one giant bundle. This is what actually shrinks
        // assets/index-*.js below the precache limit, and it also
        // means the browser can cache these vendor chunks separately
        // (they rarely change) instead of re-downloading everything
        // on every deploy.
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
        },
      },
    },
  },
});