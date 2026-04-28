import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg"; // Import Pool from the pg package

// Initialize the pg Pool with your connection string and SSL config

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Pass the pool to the Prisma adapter
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});