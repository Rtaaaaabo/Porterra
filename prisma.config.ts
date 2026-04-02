import "dotenv/config";
import { defineConfig } from "prisma/config";
import { normalizeDatabaseUrl } from "./lib/database-url";

const rawDatabaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/porterra?schema=public";
const databaseUrl = normalizeDatabaseUrl(rawDatabaseUrl);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
