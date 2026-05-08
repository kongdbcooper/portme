import "dotenv/config";
import { defineConfig } from "prisma/config";

console.log('DATABASE_URL in config:', process.env.DATABASE_URL);

export default defineConfig({
  earlyAdopter: true,
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.jsx",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});