/**
 * Password strength evaluation and generation utilities.
 * Shared between the settings form component and its unit tests.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StrengthLevel = "empty" | "weak" | "fair" | "medium" | "strong" | "very-strong";

export interface Criterion {
  key: string;
  label: string;
  test: (pw: string) => boolean;
}

// ---------------------------------------------------------------------------
// Strength criteria
// ---------------------------------------------------------------------------

export const CRITERIA: Criterion[] = [
  { key: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { key: "uppercase", label: "Uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "lowercase", label: "Lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { key: "number", label: "Number", test: (pw) => /[0-9]/.test(pw) },
  { key: "symbol", label: "Symbol", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export function evaluateStrength(password: string): StrengthLevel {
  if (!password) return "empty";
  const passed = CRITERIA.filter((c) => c.test(password)).length;
  if (passed <= 1) return "weak";
  if (passed === 2) return "fair";
  if (passed === 3) return "medium";
  if (passed === 4) return "strong";
  return "very-strong";
}

// ---------------------------------------------------------------------------
// Display configuration
// ---------------------------------------------------------------------------

export const STRENGTH_CONFIG: Record<
  StrengthLevel,
  { label: string; color: string; barColor: string; barWidth: string; score: number }
> = {
  empty: { label: "", color: "", barColor: "", barWidth: "0%", score: 0 },
  weak: {
    label: "Weak",
    color: "text-destructive",
    barColor: "bg-destructive",
    barWidth: "20%",
    score: 1,
  },
  fair: {
    label: "Fair",
    color: "text-orange-500 dark:text-orange-400",
    barColor: "bg-orange-500",
    barWidth: "40%",
    score: 2,
  },
  medium: {
    label: "Medium",
    color: "text-amber-500 dark:text-amber-400",
    barColor: "bg-amber-500",
    barWidth: "60%",
    score: 3,
  },
  strong: {
    label: "Strong",
    color: "text-lime-600 dark:text-lime-400",
    barColor: "bg-lime-500",
    barWidth: "80%",
    score: 4,
  },
  "very-strong": {
    label: "Very strong",
    color: "text-emerald-600 dark:text-emerald-400",
    barColor: "bg-emerald-500",
    barWidth: "100%",
    score: 5,
  },
};

// ---------------------------------------------------------------------------
// Strong password generator
// ---------------------------------------------------------------------------

export function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";

  // Guarantee at least one of each category
  const pool = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  // Fill remaining (target 20 chars) from combined pool
  const all = upper + lower + digits + symbols;
  for (let i = pool.length; i < 20; i++) {
    pool.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Shuffle using Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.join("");
}
