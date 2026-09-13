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
      },
    }),
  ],
});