import type { NextConfig } from "next";

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

export default nextConfig;
