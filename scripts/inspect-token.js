import "dotenv/config";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Reads a session token (from argv, stdin, or by re-capturing via
// get-session-token.js) and reports every character that is NOT part of the
// base64url alphabet a NextAuth JWT must be made of. Use this to find where a
// stray non-ASCII byte enters the token (e.g. the "invalid byte 'â' in
// Cookie.Value" warning k6 emits) — a corrupted token silently 401s every
// authenticated request in a load test.

const BASE64URL = /^[A-Za-z0-9\-_.]+$/;

function readStdin() {
  return new Promise((resolvePromise) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolvePromise(data));
  });
}

async function main() {
  let token = process.argv[2];

  if (!token && !process.stdin.isTTY) {
    token = (await readStdin()).trim();
  }

  if (!token) {
    const { execFileSync } = await import("child_process");
    try {
      token = execFileSync(
        process.execPath,
        [resolve(__dirname, "get-session-token.js")],
        { stdio: ["ignore", "pipe", "inherit"] }
      )
        .toString()
        .trim();
    } catch (e) {
      console.error("Could not fetch a token automatically.");
      console.error("Pass one explicitly or pipe it in, e.g.:");
      console.error("  node scripts/inspect-token.js \"$SESSION_TOKEN\"");
      console.error("  node scripts/get-session-token.js | node scripts/inspect-token.js");
      process.exit(1);
    }
  }

  const hexBytes = [...Buffer.from(token, "utf8")].map((b) => b.toString(16).padStart(2, "0"));

  console.log(`Token length (chars): ${[...token].length}`);
  console.log(`Token length (bytes): ${hexBytes.length}`);
  console.log(`Last 16 bytes: ${hexBytes.slice(-16).join(" ")}`);

  if (BASE64URL.test(token)) {
    console.log("OK: token is pure base64url — valid for use as a cookie value.");
    return;
  }

  console.log("INVALID: token contains non-base64url characters:");
  let shown = 0;
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (BASE64URL.test(ch)) continue;
    const cp = ch.codePointAt(0);
    console.log(
      `  index ${i}: char=${JSON.stringify(ch)} codePoint=${cp} ` +
        `(0x${cp.toString(16)}) utf8bytes=${[...new TextEncoder().encode(ch)].map((b) => b.toString(16)).join(" ")}`
    );
    if (++shown >= 20) {
      console.log("  ... (truncated)");
      break;
    }
  }
  process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
