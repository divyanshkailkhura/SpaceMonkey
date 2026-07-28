import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FILES = [
  "public/stellarium-web-engine/build/stellarium-web-engine.js",
  "public/stellarium-web-engine/build/stellarium-web-engine.wasm",
];

export async function GET() {
  const checks = FILES.map((file) => {
    const fullPath = path.join(process.cwd(), file);
    let exists = false;
    let size = 0;
    try {
      const stat = fs.statSync(fullPath);
      exists = stat.isFile();
      size = stat.size;
    } catch {
      exists = false;
    }
    return { path: `/${file.replace(/^public\//, "")}`, exists, size };
  });

  const allOk = checks.every((c) => c.exists);

  return NextResponse.json({
    status: allOk ? "ok" : "degraded",
    stellarium: checks,
    timestamp: new Date().toISOString(),
  });
}