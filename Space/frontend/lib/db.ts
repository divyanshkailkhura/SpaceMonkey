import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dns from "dns";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function parseConnectionString(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || "5432"),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1),
  };
}

async function createPool(): Promise<Pool> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const { host: hostname, port, user, password, database } = parseConnectionString(url);

  const ip = await new Promise<string>((resolve, reject) => {
    dns.resolve4(hostname, (err, addrs) => {
      if (err || !addrs.length) reject(err ?? new Error("DNS resolution failed"));
      else resolve(addrs[0]);
    });
  });

  return new Pool({
    host: ip,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false, servername: hostname },
    connectionTimeoutMillis: 15000,
  });
}

export async function getDb(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const pool = await createPool();
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}