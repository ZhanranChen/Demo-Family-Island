import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions are enabled by default in Next 15; listed here so the
  // decision is visible rather than implicit.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // headroom for voice-note / photo form submissions
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Supabase Storage public bucket URLs look like:
        // https://<project-ref>.supabase.co/storage/v1/object/public/...
        hostname: "*.supabase.co",
      },
    ],
    // Only needed while island decoration assets are placeholder SVGs
    // (public/assets/island/**). Next/Image disables SVG optimization by
    // default as an XSS precaution; safe here since these are our own
    // static files, not user-uploaded content. Revisit once placeholders
    // are replaced with real WebP/PNG artwork.
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
  },
};

export default nextConfig;
