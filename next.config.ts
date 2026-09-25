import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  async redirects() {
    // The platform started as a single course at /course/...; keep those links working.
    return [
      { source: "/course", destination: "/courses/ai-agent-evals", permanent: true },
      { source: "/course/:slug", destination: "/courses/ai-agent-evals/:slug", permanent: true },
      { source: "/glossary", destination: "/courses/ai-agent-evals/glossary", permanent: true },
    ];
  },
};

// withEve mounts the eve agent in agent/ at /eve/v1/* (same origin): in development it
// starts `eve dev` next to `next dev`; on Vercel it deploys the agent as a service.
export default withEve(nextConfig);
