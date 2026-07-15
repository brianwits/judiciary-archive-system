import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const COURT_TEST_PASSWORD = "court1234";

const STAFF = [
  {
    fullName: "Brian Mugendi",
    email: "brian.mugendi@court.go.ke",
    pjNumber: "90004",
    department: "ICT",
    role: "admin",
  },
  {
    fullName: "Court Admin",
    email: "admin@court.go.ke",
    pjNumber: "90005",
    department: "ICT",
    role: "admin",
  },
  {
    fullName: "Samuel Maina",
    email: "samuel.maina@court.go.ke",
    pjNumber: "90001",
    department: "ICT",
    role: "admin",
  },
  {
    fullName: "Rita Otieno",
    email: "rita.otieno@court.go.ke",
    pjNumber: "90002",
    department: "Registry",
    role: "registry_clerk",
  },
  {
    fullName: "Paul Kamau",
    email: "paul.kamau@court.go.ke",
    pjNumber: "90003",
    department: "Judiciary",
    role: "judge",
  },
  {
    fullName: "Hon. Magistrate Hassan",
    email: "hassan.omondi@court.go.ke",
    pjNumber: "90006",
    department: "Judiciary",
    role: "magistrate",
  },
];

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function seedUser(staff, password = COURT_TEST_PASSWORD, { syncPasswordAlways = false } = {}) {
  let userId = await findUserIdByEmail(staff.email);

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: staff.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: staff.fullName,
        pj_number: staff.pjNumber,
        department: staff.department,
      },
    });

    if (error) {
      console.error(`Failed to create ${staff.email}:`, error.message);
      return;
    }

    userId = data.user.id;
    console.log(`Created auth user: ${staff.email}`);
  } else {
    console.log(`Auth user exists: ${staff.email}`);
    if (syncPasswordAlways && password) {
      const { error: pwErr } = await supabase.auth.admin.updateUserById(userId, {
        password,
      });
      if (pwErr) {
        console.error(`Failed to sync password for ${staff.email}:`, pwErr.message);
      } else {
        console.log(`  → password synced to known test value`);
      }
    }
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: staff.fullName,
      pj_number: staff.pjNumber,
      department: staff.department,
      role: staff.role,
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error(`Failed to upsert profile for ${staff.email}:`, profileError.message);
    return;
  }

  console.log(`Profile upserted: ${staff.fullName} (${staff.role})`);
}

async function main() {
  console.log("Seeding court staff users...\n");
  for (const staff of STAFF) {
    await seedUser(staff, COURT_TEST_PASSWORD, { syncPasswordAlways: true });
  }

  console.log(`\nDone.`);
  console.log(`  • Shared seeded password: ${COURT_TEST_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
