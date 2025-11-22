import { defineConfig } from '@prisma/config';

// Provide defaults via environment variables instead of unknown config keys
const envDefaults = {
  DATABASE_URL: "file:./dev.db",
  JWT_SECRET: "dev-secret-key-12345",
  NEXTAUTH_URL: "http://localhost:3000",
};

process.env.DATABASE_URL = process.env.DATABASE_URL ?? envDefaults.DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? envDefaults.JWT_SECRET;
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? envDefaults.NEXTAUTH_URL;

export default defineConfig({
  schema: './prisma/schema.prisma',
});
