/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material", "@mui/x-date-pickers", "recharts", "dayjs"],
  },
  turbopack: {
    resolveExtensions: [".js", ".jsx", ".json"],
  },
};

export default nextConfig;
