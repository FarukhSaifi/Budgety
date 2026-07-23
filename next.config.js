/** @type {import('next').NextConfig} */
const firebaseProjectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "budgety-e7e94";

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdfjs-dist"],
  experimental: {
    optimizePackageImports: ["recharts", "dayjs", "@reduxjs/toolkit", "react-redux"],
  },
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
  async redirects() {
    return [
      {
        source: "/report",
        destination: "/reports",
        permanent: false,
      },
    ];
  },
  /**
   * Same-origin proxy for Firebase Auth helpers (`/__/auth/*`).
   * Required so signInWithRedirect works on Vercel: browsers block
   * cross-origin storage between the app host and *.firebaseapp.com.
   * @see https://firebase.google.com/docs/auth/web/redirect-best-practices
   */
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${firebaseProjectId}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/suggest-category",
        headers: [
          {
            key: "Cache-Control",
            value: "private, max-age=60",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
