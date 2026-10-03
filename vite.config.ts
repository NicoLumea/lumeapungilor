// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

export default defineConfig({
  ...(process.env["CLOUDFLARE_BUILD"] === "1" ? { nitro: { preset: "cloudflare-module" } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // mcp-js 3.0.4 compares mixed slash styles on Windows and aborts before Vite starts.
    // Generated MCP routes are committed; Lovable/Linux builds still run the generator normally.
    plugins:
      process.platform === "win32" || process.env["CLOUDFLARE_BUILD"] === "1" ? [] : [mcpPlugin()],
  },
});
