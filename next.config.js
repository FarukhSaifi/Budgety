/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
  serverExternalPackages: ["pdfjs-dist"],
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material", "@mui/x-date-pickers", "recharts", "dayjs"],
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
};

export default nextConfig;
