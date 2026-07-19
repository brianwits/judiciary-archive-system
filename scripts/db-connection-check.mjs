/**
 * Sanity-check Supabase env + REST reachability (+ optional profiles count via service role).
 * Usage: node scripts/db-connection-check.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(base, name) {
  const p = resolve(base, name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

const root = process.cwd();
loadEnvFile(root, ".env.local");
loadEnvFile(root, ".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("=== Judiciary Archive — DB connection check ===\n");

if (!url || !pub) {
  console.error("\nFAIL: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.");
  process.exit(1);
}

console.log(
  "NEXT_PUBLIC_SUPABASE_URL:",
  url.length > 32 ? `${url.slice(0, 40)}…` : url,
);
console.log("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:", `(set, ${pub.length} chars)`);
console.log("SUPABASE_SERVICE_ROLE_KEY:", sr ? "(set)" : "(missing — admin count skipped)");

const base = url.replace(/\/$/, "");
const headers = {
  apikey: pub,
  Authorization: `Bearer ${pub}`,
  Accept: "application/json",
};

let fail = false;
try {
  const res = await fetch(`${base}/rest/v1/profiles?select=id&limit=5`, { headers });
  const body = await res.text();
  console.log("\nREST GET /profiles (publishable role, anon):", res.status, res.statusText);
  if (!res.ok) {
    console.error("  Response:", body.slice(0, 500));
    fail = true;
  } else {
    let parsed = null;
    try {
      parsed = JSON.parse(body);
    } catch {
      /**/
    }
    if (Array.isArray(parsed) && parsed.length === 0) {
      console.log(
        "  OK — empty array (usual with publishable/anonymous JWT under RLS, or genuinely no rows).",
      );
    } else {
      console.log("  OK — preview:", body.slice(0, 280));
    }
  }
} catch (e) {
  console.error("\nREST fetch failed:", e instanceof Error ? e.message : e);
  fail = true;
}

if (sr) {
  const admin = createClient(url, sr, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { count, error } = await admin.from("profiles").select("id", {
    count: "exact",
    head: true,
  });
  if (error) {
    console.error("\nAdmin count profiles:", error.message);
    fail = true;
  } else {
    console.log("\nAdmin count profiles.rows:", count);
  }
}

if (fail) {
  console.error("\nRESULT: FAILED");
  process.exit(1);
}
console.log("\nRESULT: OK");
process.exit(0);
