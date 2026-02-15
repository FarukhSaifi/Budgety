import { neon } from "@neondatabase/serverless";

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export function getDb() {
  return sql;
}

export async function query(fn) {
  if (!sql) return [];
  try {
    return await fn();
  } catch (err) {
    throw err;
  }
}
