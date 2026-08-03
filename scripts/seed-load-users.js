import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import bcrypt from "bcryptjs";
import dns from "dns";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env"), quiet: true });
dotenv.config({ path: resolve(__dirname, "..", ".env.development"), override: true, quiet: true });
dotenv.config({ path: resolve(__dirname, "..", ".env.local"), override: true, quiet: true });

const DATABASE_URL = process.env.SPACE_PG_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required (point at the DB you want to seed).");
  process.exit(1);
}

const COUNT = parseInt(process.argv[2] || process.env.LOAD_USER_COUNT || "20", 10);
const PASSWORD = process.env.LOAD_PASSWORD || "LoadTest2026!";

const userPool = [];
for (let i = 1; i <= COUNT; i++) {
  userPool.push({ email: `loadtest.${i}@spacemonkey.com`, password: PASSWORD });
}

const hash = bcrypt.hashSync(PASSWORD, 10);
const u = new URL(DATABASE_URL);
const hostname = u.hostname;
const port = parseInt(u.port || "5432");
const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

const ip = isLocal
  ? hostname
  : await new Promise((res, rej) => {
      dns.resolve4(hostname, (err, addrs) => {
        if (err || !addrs.length) rej(err ?? new Error(`DNS resolution failed for ${hostname}`));
        else res(addrs[0]);
      });
    });

const client = new pg.Client({
  host: ip,
  port,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.slice(1),
  ssl: isLocal ? false : { rejectUnauthorized: false, servername: hostname },
});

await client.connect();

let created = 0;
for (const u of userPool) {
  const existing = await client.query(`SELECT id FROM "User" WHERE email = $1`, [u.email]);
  if (existing.rowCount > 0) continue;
  const uuid = (await import("crypto")).randomUUID();
  const name = `Load Test User`;
  await client.query(
    `INSERT INTO "User" ("id","email","passwordHash","name","bio","location","role","createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [uuid, u.email, hash, name, "Load test account.", "San Francisco, CA", "user", new Date().toISOString()]
  );
  created++;
}

await client.end();
console.log(`Seeded ${created} new load-test users (total pool ${COUNT}). Password for all: ${PASSWORD}`);
console.log(`USER_POOL=${JSON.stringify(userPool)}`);
