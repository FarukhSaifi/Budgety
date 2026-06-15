import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import "server-only";

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 10000,
    })
  : null;

function normalizeBaseUrl(url) {
  if (!url) return url;
  return url.replace(/\/+$/, "");
}

const appUrl = normalizeBaseUrl(
  process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000",
);

const trustedOrigins = [
  "http://localhost:3000",
  appUrl,
  ...(process.env.VERCEL_URL ? [`https://${normalizeBaseUrl(process.env.VERCEL_URL)}`] : []),
  ...(process.env.VERCEL_BRANCH_URL ? [`https://${normalizeBaseUrl(process.env.VERCEL_BRANCH_URL)}`] : []),
].filter(Boolean);

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: appUrl,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [...new Set(trustedOrigins)],
  plugins: [
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
    nextCookies(),
  ],
});
