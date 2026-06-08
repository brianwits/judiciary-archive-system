import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const PROJECT_REF = "zjzqogrrlvxavxicdcec";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const PRODUCTION_URL = "https://judiciary-archive-system.vercel.app";
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_amDKb3bHB9COPKsiCHvspQ_mSO8PVvJ";

const REDIRECT_URLS = [
  `${PRODUCTION_URL}/**`,
  "https://judiciary-archive-system-*.vercel.app/**",
  "https://*.vercel.app/**",
  "http://localhost:3000/**",
];

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
    throw new Error(
      `Failed to fetch API keys: ${response.status} ${await response.text()}`,
    );
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
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
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

  for (const url of REDIRECT_URLS) {
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

  console.log("Supabase Auth URLs configured for Vercel production + previews.");
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function upsertVercelEnv(name, value, environments = ["production", "preview", "development"]) {
  for (const environment of environments) {
    spawnSync("vercel", ["env", "rm", name, environment, "--yes"], {
      stdio: "ignore",
      cwd: process.cwd(),
    });

    const update = spawnSync(
      "vercel",
      ["env", "update", name, environment, "--yes", "--value", value],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    if (update.status === 0) {
      continue;
    }

    run("vercel", [
      "env",
      "add",
      name,
      environment,
      "--yes",
      "--force",
      "--value",
      value,
    ]);
  }

  console.log(`Vercel env set: ${name} (${environments.join(", ")})`);
}

function writeLocalEnv(serviceRoleKey) {
  const lines = [
    "NEXT_PUBLIC_USE_MOCK_DATA=false",
    `NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`,
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${PUBLISHABLE_KEY}`,
  ];

  if (serviceRoleKey) {
    lines.push(`SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`);
  }

  writeFileSync(resolve(process.cwd(), ".env.local"), `${lines.join("\n")}\n`);
  console.log("Updated .env.local for hosted Supabase.");
}

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (accessToken) {
    console.log("Configuring Supabase Auth redirect URLs...");
    await configureAuthUrls(accessToken);

    if (!serviceRoleKey) {
      console.log("Fetching service_role key from Supabase Management API...");
      serviceRoleKey = await fetchServiceRoleKey(accessToken);
    }
  } else {
    console.warn(
      "SUPABASE_ACCESS_TOKEN not set — skipping Supabase Auth URL configuration.",
    );
    console.warn(
      "Set it from https://supabase.com/dashboard/account/tokens and re-run.",
    );
  }

  console.log("Setting Vercel environment variables...");
  upsertVercelEnv("NEXT_PUBLIC_USE_MOCK_DATA", "false");
  upsertVercelEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  upsertVercelEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", PUBLISHABLE_KEY);

  if (serviceRoleKey) {
    upsertVercelEnv("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);
  } else {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY not available — skipping Vercel service role env.",
    );
    console.warn(
      "User Management emails and db:seed-users require this key on Vercel.",
    );
  }

  writeLocalEnv(serviceRoleKey ?? null);
  console.log("Vercel Supabase configuration complete.");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
