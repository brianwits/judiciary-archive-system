import { describe, it, expect } from "vitest";
import { evaluateStrength, generateStrongPassword } from "@/lib/password-strength";

// Character pools used by generateStrongPassword for character validation
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*";
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("evaluateStrength — empty", () => {
  it("returns 'empty' for empty string", () => {
    expect(evaluateStrength("")).toBe("empty");
  });
});

describe("evaluateStrength — weak (0–1 criteria met)", () => {
  it("returns 'weak' for single lowercase char (1 criterion: lowercase)", () => {
    expect(evaluateStrength("a")).toBe("weak");
  });

  it("returns 'weak' for short lowercase-only (1 criterion: lowercase)", () => {
    expect(evaluateStrength("abcdefg")).toBe("weak"); // 7 chars, length fails
  });

  it("returns 'weak' for short uppercase-only (1 criterion: uppercase)", () => {
    expect(evaluateStrength("ABCDEFG")).toBe("weak"); // 7 chars
  });

  it("returns 'weak' for short digits-only (1 criterion: digit)", () => {
    expect(evaluateStrength("1234567")).toBe("weak"); // 7 chars
  });

  it("returns 'weak' for short symbols-only (1 criterion: symbol)", () => {
    expect(evaluateStrength("!@#$%^&")).toBe("weak"); // 7 chars
  });

  it("returns 'weak' for whitespace-only with length < 8 (1 criterion: symbol)", () => {
    expect(evaluateStrength("   ")).toBe("weak"); // 3 spaces, space matches symbol regex
  });
});

describe("evaluateStrength — fair (exactly 2 criteria met)", () => {
  it("returns 'fair' for lowercase + digit, no uppercase/symbol, length < 8", () => {
    expect(evaluateStrength("abc12")).toBe("fair");
  });

  it("returns 'fair' for lowercase + uppercase, no digit/symbol, length < 8", () => {
    expect(evaluateStrength("AbCd")).toBe("fair");
  });

  it("returns 'fair' for digit + symbol, no upper/lower, length < 8", () => {
    expect(evaluateStrength("12!@")).toBe("fair");
  });

  it("returns 'fair' for lowercase + symbol, no upper/digit, length < 8", () => {
    expect(evaluateStrength("abc!@")).toBe("fair");
  });

  it("returns 'fair' for uppercase + symbol, no lower/digit, length < 8", () => {
    expect(evaluateStrength("ABC!@")).toBe("fair");
  });

  it("returns 'fair' for length + lowercase (8 lowercase chars)", () => {
    expect(evaluateStrength("abcdefgh")).toBe("fair");
  });

  it("returns 'fair' for length + uppercase (8 uppercase chars)", () => {
    expect(evaluateStrength("ABCDEFGH")).toBe("fair");
  });

  it("returns 'fair' for length + digit (8 digit chars)", () => {
    expect(evaluateStrength("12345678")).toBe("fair");
  });

  it("returns 'fair' for length + symbol (8 symbol chars)", () => {
    expect(evaluateStrength("!@#$%^&*")).toBe("fair");
  });
});

describe("evaluateStrength — medium (exactly 3 criteria met)", () => {
  it("returns 'medium' for upper + lower + digit, no symbol, length < 8", () => {
    expect(evaluateStrength("Ab1")).toBe("medium");
  });

  it("returns 'medium' for upper + lower + symbol, no digit, length < 8", () => {
    expect(evaluateStrength("Ab!")).toBe("medium");
  });

  it("returns 'medium' for lower + digit + symbol, no upper, length < 8", () => {
    expect(evaluateStrength("a1!")).toBe("medium");
  });

  it("returns 'medium' for upper + digit + symbol, no lower, length < 8", () => {
    expect(evaluateStrength("A1!")).toBe("medium");
  });

  it("returns 'medium' for length + lowercase + digit", () => {
    expect(evaluateStrength("abcdefg1")).toBe("medium");
  });

  it("returns 'medium' for length + lowercase + uppercase", () => {
    expect(evaluateStrength("abcdefgA")).toBe("medium");
  });

  it("returns 'medium' for length + uppercase + digit", () => {
    expect(evaluateStrength("ABCDEFG1")).toBe("medium");
  });

  it("returns 'medium' for length + lowercase + symbol", () => {
    expect(evaluateStrength("abcdefg!")).toBe("medium");
  });
});

describe("evaluateStrength — strong (exactly 4 criteria met)", () => {
  it("returns 'strong' for upper + lower + digit + symbol, length < 8", () => {
    expect(evaluateStrength("Ab1!")).toBe("strong");
  });

  it("returns 'strong' for length + upper + lower + digit (no symbol)", () => {
    expect(evaluateStrength("Abcdefgh1")).toBe("strong");
  });

  it("returns 'strong' for length + upper + digit + symbol (no lowercase)", () => {
    expect(evaluateStrength("ABCDEF1!@#")).toBe("strong");
  });

  it("returns 'strong' for length + lower + digit + symbol (no uppercase)", () => {
    expect(evaluateStrength("abcdef1!@#")).toBe("strong");
  });

  it("returns 'strong' for length + upper + lower + symbol (no digit)", () => {
    expect(evaluateStrength("Abcdef!@#")).toBe("strong");
  });

  it("returns 'strong' for 7 chars with upper + lower + digit + symbol", () => {
    expect(evaluateStrength("Ab1!@#$")).toBe("strong");
  });
});

describe("evaluateStrength — very-strong (all 5 criteria met)", () => {
  it("returns 'very-strong' for a password meeting all 5 criteria", () => {
    expect(evaluateStrength("Abcdef1!")).toBe("very-strong");
  });

  it("returns 'very-strong' for a long mixed password", () => {
    expect(evaluateStrength("P@ssw0rdSecure!")).toBe("very-strong");
  });

  it("returns 'very-strong' for a complex password", () => {
    expect(evaluateStrength("Str0ng!P@ss#2024")).toBe("very-strong");
  });

  it("returns 'very-strong' for the generated 20-char password style", () => {
    const generated = "Ab2!defGhij3Klmn#opQ";
    expect(evaluateStrength(generated)).toBe("very-strong");
  });

  it("returns 'very-strong' for exactly 8 chars meeting all criteria", () => {
    expect(evaluateStrength("Abcd1!@#")).toBe("very-strong");
  });
});

describe("evaluateStrength — boundary conditions", () => {
  it("handles very long password without issues", () => {
    const long = "A".repeat(50) + "b" + "1" + "!";
    expect(evaluateStrength(long)).toBe("very-strong");
  });

  it("handles repeated 4-char pattern at length 800", () => {
    const almostAll = "a1A!".repeat(200);
    expect(evaluateStrength(almostAll)).toBe("very-strong");
  });

  it("handles password with leading/trailing spaces (space counts as symbol)", () => {
    expect(evaluateStrength(" Abcdef1! ")).toBe("very-strong");
  });
});

describe("evaluateStrength — unicode and special characters", () => {
  it("treats accented characters as symbols (non-ASCII)", () => {
    // é matches /[^A-Za-z0-9]/ → symbol ✓
    // "ébcdefgh" — length 8 ✓, lowercase ✓, symbol ✓ → 3 criteria → "medium"
    expect(evaluateStrength("ébcdefgh")).toBe("medium");
  });

  it("treats underscores as symbols", () => {
    // _ matches /[^A-Za-z0-9]/ → symbol ✓
    // "abc_def_1" — length 9 ✓, lowercase ✓, digit ✓, symbol ✓ → 4 criteria → "strong"
    expect(evaluateStrength("abc_def_1")).toBe("strong");
  });

  it("treats dots as symbols", () => {
    expect(evaluateStrength("abc.def.1")).toBe("strong");
  });
});

// ---------------------------------------------------------------------------
// generateStrongPassword — structural guarantees
// ---------------------------------------------------------------------------

describe("generateStrongPassword — length", () => {
  it("returns exactly 20 characters", () => {
    const pw = generateStrongPassword();
    expect(pw).toHaveLength(20);
  });

  it("consistently returns 20 characters over 50 iterations", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateStrongPassword()).toHaveLength(20);
    }
  });
});

describe("generateStrongPassword — character diversity", () => {
  it("contains at least one uppercase letter", () => {
    const pw = generateStrongPassword();
    expect(pw).toMatch(/[A-Z]/);
  });

  it("contains at least one lowercase letter", () => {
    const pw = generateStrongPassword();
    expect(pw).toMatch(/[a-z]/);
  });

  it("contains at least one digit", () => {
    const pw = generateStrongPassword();
    expect(pw).toMatch(/[0-9]/);
  });

  it("contains at least one symbol", () => {
    const pw = generateStrongPassword();
    expect(pw).toMatch(/[^A-Za-z0-9]/);
  });

  it("contains characters from the allowed pool only", () => {
    for (let iter = 0; iter < 50; iter++) {
      const pw = generateStrongPassword();
      for (const ch of pw) {
        expect(ALL).toContain(ch);
      }
    }
  });

  it("includes at least one character from each category in every call", () => {
    // The generator guarantees one of each category per password
    for (let i = 0; i < 20; i++) {
      const pw = generateStrongPassword();
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[^A-Za-z0-9]/);
    }
  });
});

describe("generateStrongPassword — ambiguous character exclusion", () => {
  const AMBIGUOUS = /[0O1lI]/;

  it("excludes 0, O, 1, l, I from generated passwords", () => {
    for (let iter = 0; iter < 50; iter++) {
      const pw = generateStrongPassword();
      expect(pw).not.toMatch(AMBIGUOUS);
    }
  });
});

describe("generateStrongPassword — strength evaluation", () => {
  it("scores as 'very-strong' via evaluateStrength", () => {
    for (let iter = 0; iter < 50; iter++) {
      const pw = generateStrongPassword();
      expect(evaluateStrength(pw)).toBe("very-strong");
    }
  });
});

describe("generateStrongPassword — randomness", () => {
  it("produces different results on successive calls", () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(generateStrongPassword());
    }
    // With 20 samples, we should see at least 18 unique values
    // (incredibly unlikely to have fewer given 20-char passwords)
    expect(results.size).toBeGreaterThanOrEqual(18);
  });
});
