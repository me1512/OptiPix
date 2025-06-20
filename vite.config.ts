import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import legacy from "@vitejs/plugin-legacy";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import sitemapPlugin from "vite-plugin-sitemap";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: env.BASE_URL || "/OptiPix/", // ✅ VERY IMPORTANT for GitHub Pages
    plugins: [
      react(),
      sitemapPlugin({
        hostname: env.VITE_BASE_URL || "https://me1512.github.io/OptiPix",
        outDir: "dist",
        generateRobotsTxt: true,
        robots: [
          {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin"],
            crawlDelay: 10,
          },
          {
            userAgent: "Googlebot-Image",
            allow: ["/images"],
          },
        ],
      }),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "robots.txt", "apple-touch-icon.png"],
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
          ],
        },
        manifest: {
          name: "OptiPix",
          short_name: "OptiPix",
          description: "Advanced Image Compression at Your Fingertips.",
          theme_color: "#0f172a",
          background_color: "#ffffff",
          display: "standalone",
          start_url: env.BASE_URL, // ✅ Fix
          scope: env.BASE_URL, // ✅ Fix
          icons: [
            {
              src: "icon-192.png", // ✅ No leading slash
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "icon-512.png", // ✅ No leading slash
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        devOptions: {
          enabled: process.env.NODE_ENV === "development",
        },
      }),
      tailwindcss(),
      // Legacy targets browser support - reads from .browserslistrc
      legacy({
        additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
        modernPolyfills: true,
        renderLegacyChunks: true,
        polyfills: ["es.symbol", "es.promise", "es.promise.finally", "es.promise.all-settled", "es.array.from", "es.array.iterator", "es.object.assign", "es.map", "es.set"],
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 1600,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },
    },
    css: {
      devSourcemap: true,
    },
    server: {
      hmr: {
        overlay: true,
      },
    },
    preview: {
      port: 4173,
      host: true,
    },
  };
});
