/**
 * Prisma v7 configuration (connection only — the data models live in
 * exactly one place: `prisma/schema.prisma`).
 * Reading DATABASE_URL here does not connect to anything until a Prisma
 * Client query or `prisma migrate` runs, so the API boots normally with
 * no database present.
 */
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});