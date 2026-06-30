import type { NextConfig } from "next";

const lanIp = process.env.LAN_IP ?? "192.168.0.166";

const nextConfig: NextConfig = {
  // Allow phone/tablet on LAN to load Next.js dev assets (HMR, etc.)
  allowedDevOrigins: [lanIp, "localhost", "127.0.0.1"],
};

export default nextConfig;
