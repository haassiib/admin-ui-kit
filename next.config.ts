import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Stops `next dev` writing AGENTS.md / CLAUDE.md into a published repo.
  agentRules: false,
  // The gallery renders avatars and logos straight from whatever the demo data
  // points at; unoptimized keeps that working without an images allowlist.
  images: { unoptimized: true },
};

export default nextConfig;
