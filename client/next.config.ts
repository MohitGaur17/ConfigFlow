import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/support",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
