import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A fully static site: every page is pre-rendered at build time (the catalog
  // is fixed), so `next build` writes plain HTML to `out/` and Cloudflare serves
  // it as static assets — no server to run. See wrangler.jsonc.
  output: 'export',
  // Stops `next dev` writing AGENTS.md / CLAUDE.md into a published repo.
  agentRules: false,
  // The gallery renders avatars and logos straight from whatever the demo data
  // points at; unoptimized keeps that working without an images allowlist.
  images: { unoptimized: true },
};

export default nextConfig;
