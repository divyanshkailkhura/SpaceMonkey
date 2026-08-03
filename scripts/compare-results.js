#!/usr/bin/env node
import { readFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = resolve(__dirname, "..", "load-tests", "results");

const SCENARIOS = [
  { key: "prod", label: "Production", file: "posts-prod.json" },
  { key: "scenario-a", label: "Scenario A (Local app + Neon dev DB)", file: "posts-scenario-a.json" },
  { key: "scenario-b", label: "Scenario B (Local app + Local PG)", file: "posts-scenario-b.json" },
];

const METRICS = [
  { key: "posts_list", ascending: true },
  { key: "posts_search", ascending: true },
  { key: "posts_get", ascending: true },
  { key: "posts_following", ascending: true },
  { key: "posts_create", ascending: true },
  { key: "posts_vote", ascending: true },
  { key: "posts_comment", ascending: true },
];

function loadMetrics(scenario) {
  const path = join(RESULTS_DIR, scenario.file);
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const out = {};
  for (const m of METRICS) {
    const metric = raw.metrics?.[m.key];
    out[m.key] = metric?.["p(95)"] ?? null;
  }
  out["http_req_failed"] = raw.metrics?.http_req_failed?.value ?? null;
  return out;
}

const data = {};
for (const s of SCENARIOS) {
  data[s.key] = loadMetrics(s);
}

function pct(a, b) {
  if (a == null || b == null) return "-";
  if (b === 0) return "n/a";
  const d = ((a - b) / b) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
}

function fmt(v) {
  if (v == null) return "-";
  return v < 1000 ? `${v.toFixed(1)}ms` : `${(v / 1000).toFixed(2)}s`;
}

function fmtRate(v) {
  if (v == null) return "-";
  return `${(v * 100).toFixed(1)}%`;
}

console.log("=".repeat(100));
console.log("SPACEMONKEY LOAD TEST COMPARISON — posts.js (unchanged thresholds)");
console.log("=".repeat(100));
console.log(
  "Suite runs: Prod (Render + Neon prod, original code) | Scenario A (local next start + Neon dev DB, fixed code) | Scenario B (local next start + local PG, fixed code)\n"
);

console.log(
  "Endpoint       ".padEnd(17) +
  "Prod p95".padEnd(14) +
  "A p95".padEnd(14) +
  "B p95".padEnd(14) +
  "%A vs Prod".padEnd(11) +
  "%B vs Prod"
);
console.log("-".repeat(100));

for (const m of METRICS) {
  const prod = data["prod"][m.key];
  const a = data["scenario-a"][m.key];
  const b = data["scenario-b"][m.key];
  if (prod == null && a == null && b == null) continue;
  console.log(
    m.key.padEnd(17) +
    fmt(prod).padEnd(14) +
    fmt(a).padEnd(14) +
    fmt(b).padEnd(14) +
    pct(a, prod).padEnd(11) +
    pct(b, prod)
  );
}

const prodFail = data["prod"]["http_req_failed"];
const aFail = data["scenario-a"]["http_req_failed"];
const bFail = data["scenario-b"]["http_req_failed"];
console.log(
  "".padEnd(17) +
  "http_req_failed".padEnd(14) +
  "".padEnd(14) +
  "".padEnd(14) +
  "".padEnd(11) +
  ""
);
console.log(
  "req_failed".padEnd(17) +
  fmtRate(prodFail).padEnd(14) +
  fmtRate(aFail).padEnd(14) +
  fmtRate(bFail).padEnd(14) +
  pct(aFail * 100, prodFail * 100).padEnd(11) +
  pct(bFail * 100, prodFail * 100)
);

console.log("\n" + "=".repeat(100));
console.log("INTERPRETATION (p95 latency, ms — lower is better)");
console.log("=".repeat(100));

const aDelta = pct(data["scenario-a"]["posts_list"], data["prod"]["posts_list"]);
const bDelta = pct(data["scenario-b"]["posts_list"], data["prod"]["posts_list"]);
console.log(
  `\nposts_list: Prod=${fmt(data["prod"]["posts_list"])} -> A=${fmt(data["scenario-a"]["posts_list"])} -> B=${fmt(data["scenario-b"]["posts_list"])}`
);
console.log(
  `  Scenario A vs Production: ${aDelta} — rendering/CPU moved off Render's 0.1 CPU onto local hardware; ` +
  `with the N+1 fix, latency is dominated by remote Neon free-tier + network round-trips rather than CPU.`
);
console.log(
  `  Scenario B vs Production: ${bDelta} — both Render CPU and remote Neon removed; local PG (no N+1, no network, no free-tier limits) collapses latency to ~10-30ms.`
);
console.log(
  `  Scenario B vs A: ${pct(data["scenario-b"]["posts_list"], data["scenario-a"]["posts_list"])} — remaining delta is the remote Neon free-tier + network cost that Persists even after the N+1 fix.`
);
