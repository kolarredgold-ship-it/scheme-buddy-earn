import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { spawnSync } from "node:child_process";
import { componentTagger } from "lovable-tagger";

// Generates public/sitemap.xml before build so https://techrola.in/sitemap.xml
// is served as a real static file (Lovable hosting doesn't support redirects).
function sitemapPlugin(): Plugin {
  const run = () => {
    const result = spawnSync(
      "npx",
      ["tsx", "scripts/generate-sitemap.ts"],
      { stdio: "inherit", cwd: __dirname },
    );
    if (result.status !== 0) {
      console.warn("[sitemap] generation skipped or failed (non-fatal)");
    }
  };
  return {
    name: "generate-sitemap",
    apply: "build",
    buildStart() {
      run();
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    sitemapPlugin(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
