import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const CANDIDATES = [
  "",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  "/index.ts",
  "/index.tsx",
  "/index.js",
  "/index.jsx",
];

/**
 * Resolve `@/…` the way tsconfig does: `./src/*` first, then `./*`.
 *
 * This repo has two source trees — `src/` and a root-level one holding
 * `store/`, `components/` and `app/` — and tsconfig's paths array falls back
 * from the first to the second. A plain `{"@": "src"}` alias only ever finds
 * the first, so importing anything from the root tree failed to resolve and
 * nothing under it could be covered at all.
 */
const atAlias = {
  name: "at-alias-src-then-root",
  enforce: "pre" as const,
  resolveId(source: string) {
    if (!source.startsWith("@/")) return null;
    const rel = source.slice(2);
    for (const base of [resolve(__dirname, "src"), __dirname]) {
      for (const ext of CANDIDATES) {
        const path = resolve(base, rel + ext);
        if (existsSync(path) && statSync(path).isFile()) return path;
      }
    }
    return null;
  },
};

export default defineConfig({
  plugins: [react(), atAlias],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // `app/` too: the route wrappers there hold real behaviour — which screen
    // a create lands on, whether a spent form stays in history — and none of
    // it was reachable by a test while only `src/` was collected.
    //
    // `store/` for the same reason. The zustand stores are where API responses
    // are turned into what a screen renders, which is exactly where a response
    // whose shape was misread put a wrapper object into the owner list. A test
    // written there was silently collected by nothing until this line covered
    // it — the failure mode being a green run that never loaded the file.
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "app/**/*.{test,spec}.{ts,tsx}",
      "store/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
});
