import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Build ra HTML/JS tĩnh trong `dist/client`, không cần server.
    output: "export",
};

export default nextConfig;
