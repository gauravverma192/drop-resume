import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json above this directory makes Turbopack infer the
  // wrong workspace root, so pin it to the app.
  turbopack: {
    root: path.dirname(new URL(import.meta.url).pathname),
  },
};

export default nextConfig;
