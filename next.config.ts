import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/rutas", destination: "/mapa", permanent: false }];
  },
};

export default nextConfig;
