#!/usr/bin/env node
/**
 * Supabase mode login flow integration test.
 *
 * Tests the auth layer directly against the local Supabase instance:
 *   - signInWithPassword with valid credentials
 *   - Session creation & token validation
 *   - Profile linkage (public.profiles row must exist)
 *   - Error handling (wrong password, nonexistent user)
 *   - Every user in the shared seeded roster can authenticate
 *
 * Run: node scripts/test-supabase-login.mjs
 *
 * PREREQUISITES (run in order):
 *   1. npx supabase start
 *   2. npx supabase db reset       (applies migrations + seed.sql)
 *   3. node scripts/seed-users.mjs (creates auth.users + profiles)
 *   4. .env.local must have:
 *        NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
 *        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=pyb_...
 *        SUPABASE_SERVICE_ROLE_KEY=svc_...
 *
 * NOTE: This tests the Supabase Auth layer directly. It does NOT
 * test the Next.js Server Action (src/app/actions/auth.ts) which
 * adds rate limiting, ensureProfileRowForCurrentUser(), and
 * is_active checks on top of auth.signInWithPassword.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { COURT_TEST_PASSWORD, STAFF } from "./court-test-users.mjs";

// Load .env.local if available
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

async function testValidLogin(supabase, email, password, label) {
  console.log(`\n🔑 Test: ${label}`);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  assert(!error, `signInWithPassword should succeed: ${email}`);
  assert(data.session !== null, "Session should be created");
  assert(data.user !== null, "User should be returned");
  assert(data.user.email === email, `Email should match: ${email}`);

  if (data.session) {
    assert(typeof data.session.access_token === "string" && data.session.access_token.length > 0, "Access token should be a non-empty string");
    assert(data.session.expires_in > 0, "Session should have positive expiry");
  }

  if (data.user) {
    assert(data.user.aud === "authenticated", "User aud should be 'authenticated'");
    assert(data.user.role === "authenticated", "User role should be 'authenticated'");
  }

  // Verify profile exists in public.profiles (using service role client)
  if (data.user) {
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, full_name, role, is_active")
      .eq("id", data.user.id)
      .single();

    assert(!profileError, `Profile query should succeed (${profileError?.message || "ok"})`);
    assert(profile !== null && profile !== undefined, "Profile should exist");
    if (profile) {
      assert(profile.is_active === true, "Profile should be active");
      assert(profile.role !== null && profile.role !== undefined, "Profile should have a role");
    }
  }

  // Sign out
  const { error: signOutError } = await supabase.auth.signOut();
  assert(!signOutError, "Sign out should succeed");

  // Verify session is cleared
  const { data: { session } } = await supabase.auth.getSession();
  assert(session === null, "Session should be null after sign out");
}

async function testInvalidCredentials(supabase) {
  console.log(`\n🔑 Test: Invalid credentials`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: "brian.mugendi@court.go.ke",
    password: "wrongpassword",
  });

  assert(error !== null, "Should return an error for wrong password");
  assert(data.session === null, "Session should not be created");
  assert(error.message.includes("Invalid"), `Error message should mention invalid: "${error.message}"`);
}

async function testNonExistentUser(supabase) {
  console.log(`\n🔑 Test: Non-existent user`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: "nonexistent@court.go.ke",
    password: COURT_TEST_PASSWORD,
  });

  assert(error !== null, "Should return an error for non-existent user");
  assert(data.session === null, "Session should not be created");
}

async function testAllSeededUsersCanLogin(supabase) {
  console.log(`\n🔑 Test: All seeded users can log in`);

  const emails = STAFF.map(({ email }) => ({ email, pw: COURT_TEST_PASSWORD }));

  for (const { email, pw } of emails) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    assert(!error, `${email} should log in successfully`);
    assert(data.session !== null, `${email} should get a session`);

    if (data.session) {
      await supabase.auth.signOut();
    }
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("Supabase Login Flow Integration Test");
  console.log("=".repeat(60));
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  // Test with anon key (simulating what the client-side does)
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      flowType: "pkce",
    },
  });

  // Run tests
  await testValidLogin(supabase, "brian.mugendi@court.go.ke", COURT_TEST_PASSWORD, "Valid login (seeded staff)");
  await testValidLogin(supabase, "admin@court.go.ke", COURT_TEST_PASSWORD, "Valid login (shared admin)");
  await testInvalidCredentials(supabase);
  await testNonExistentUser(supabase);
  await testAllSeededUsersCanLogin(supabase);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("=".repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test script error:", err);
  process.exit(1);
});
