import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const PROJECT_REF = "zjzqogrrlvxavxicdcec";
const PRODUCTION_URL = "https://judiciary-archive-system.vercel.app";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

async function fetchServiceRoleKey(accessToken) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch API keys: ${response.status} ${await response.text()}`);
  }

  const keys = await response.json();
  const serviceRole = keys.find((key) => key.name === "service_role");
  if (!serviceRole?.api_key) {
    throw new Error("service_role key not found in Supabase project API keys.");
  }
  return serviceRole.api_key;
}

async function configureAuthUrls(accessToken) {
  const getResponse = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!getResponse.ok) {
    throw new Error(
      `Failed to read auth config: ${getResponse.status} ${await getResponse.text()}`,
    );
  }

  const current = await getResponse.json();
  const existing = new Set(
    (current.uri_allow_list ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

  for (const url of [
    `${PRODUCTION_URL}/**`,
    "https://judiciary-archive-system-*.vercel.app/**",
    "https://*.vercel.app/**",
    "http://localhost:3000/**",
  ]) {
    existing.add(url);
  }

  const patchResponse = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site_url: PRODUCTION_URL,
        uri_allow_list: [...existing].join(","),
      }),
    },
  );

  if (!patchResponse.ok) {
    throw new Error(
      `Failed to update auth config: ${patchResponse.status} ${await patchResponse.text()}`,
    );
  }

  console.log("Supabase Auth URLs configured for Vercel.");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function printSqlEditorSteps() {
  console.log("\nIf db query fails, apply these in Supabase Dashboard → SQL Editor:");
  console.log("  1. supabase/seed.sql");
  console.log("  2. supabase/scripts/storage-policies.sql");
}

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    console.error(
      "Missing SUPABASE_ACCESS_TOKEN. Run: npx supabase login\nThen export SUPABASE_ACCESS_TOKEN or re-run this script in the same shell.",
    );
    process.exit(1);
  }

  process.env.SUPABASE_ACCESS_TOKEN = accessToken;

  console.log(`Linking project ${PROJECT_REF}...`);
  run("npx", ["supabase", "link", "--project-ref", PROJECT_REF]);

  console.log("Pushing migrations...");
  run("npx", ["supabase", "db", "push", "--linked"]);

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    `https://${PROJECT_REF}.supabase.co`;

  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.log("Fetching service_role key from Supabase Management API...");
    serviceRoleKey = await fetchServiceRoleKey(accessToken);
    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;

  console.log("Configuring Supabase Auth redirect URLs for Vercel...");
  await configureAuthUrls(accessToken);

  console.log("Applying live seed SQL and storage policies...");
  run("npx", ["supabase", "db", "query", "-f", "supabase/seed.sql", "--linked"]);
  run("npx", [
    "supabase",
    "db",
    "query",
    "-f",
    "supabase/scripts/storage-policies.sql",
    "--linked",
  ]);

  console.log("Seeding court staff users...");
  run("node", ["scripts/seed-users.mjs"]);

  console.log("\nHosted Supabase setup complete.");
  console.log("Next: npm run vercel:configure-supabase && vercel --prod");
}

main().catch((error) => {
  console.error(error.message ?? error);
  printSqlEditorSteps();
  process.exit(1);
});
