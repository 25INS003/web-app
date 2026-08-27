import { describe, it, expect } from "vitest";
import {
  scorePassword,
  identityTokens,
  MIN_PASSWORD_LENGTH,
  MIN_ACCEPTED_SCORE,
} from "./password-strength";

/**
 * The shared vector table.
 *
 * A byte-identical copy of the one in
 * `backend/tests/unit/passwordStrength.test.js`. The scorer exists twice —
 * once on the server where it is enforced, once here so the meter can respond
 * to a keystroke — and two implementations of one rule drift. This table is
 * what turns that drift into a red test instead of a browser promising a
 * password the API then refuses.
 *
 * Change a number here and you must change it there.
 */
const VECTORS: [string, number, string][] = [
  ["a", 0, "far under the length floor"],
  ["short1!", 0, "7 characters — one under"],
  ["password", 0, "the single most common password"],
  ["P@ssw0rd", 0, "the same word, leetspeak does not save it"],
  ["12345678", 0, "a run of digits"],
  ["qwertyuiop", 0, "a keyboard row"],
  ["aaaaaaaa", 0, "one repeated character"],
  ["abcabcabcabc", 0, "a repeated unit"],
  ["lmnopqrs", 0, "an alphabet walk"],
  ["abc12345", 0, "a common stem with digits after it"],
  ["froglamp9", 0, "no uppercase, no symbol"],
  ["newpass123", 0, "no uppercase, no symbol"],
  ["Froglamp9", 0, "still no symbol"],
  ["Froglamp!", 0, "still no number"],
  ["froglamp9!", 0, "still no uppercase"],
  ["Password123!", 1, "ticks every mandatory box and is still worthless"],
  ["Frog9!La", 2, "the shortest thing that clears every gate"],
  ["Test123!pass", 3, "12 characters, all requirements met"],
  ["correcthorsebatterystaple", 0, "a strong passphrase, refused by the gate"],
  ["Tr0ub4dour&3xkcd", 4, "16 characters, all requirements met"],
];

describe("password strength scoring (mirror of the server rule)", () => {
  it.each(VECTORS)("%s scores %i (%s)", (password, expected) => {
    expect(scorePassword(password).score).toBe(expected);
  });

  it("accepts at fair and above, refuses below", () => {
    for (const [password, score] of VECTORS) {
      expect(scorePassword(password).acceptable).toBe(
        score >= MIN_ACCEPTED_SCORE,
      );
    }
  });

  it("puts the floor at 8, not the old 6", () => {
    expect(scorePassword("Abc123!").score).toBe(0); // 7
    expect(scorePassword("Abc123!x").score).toBeGreaterThan(0); // 8
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  it("always reports a reason when it refuses", () => {
    for (const [password, score] of VECTORS) {
      if (score >= MIN_ACCEPTED_SCORE) continue;
      expect(scorePassword(password).reasons.length).toBeGreaterThan(0);
    }
  });

  it("survives an empty field without throwing", () => {
    expect(scorePassword("").score).toBe(0);
    expect(scorePassword(undefined).score).toBe(0);
    expect(scorePassword(null).score).toBe(0);
  });

  it("ranks by length once every requirement is met", () => {
    expect(scorePassword("Frog9!La").score).toBeLessThan(
      scorePassword("Frog9!Lantern").score,
    );
    expect(scorePassword("Frog9!Lantern").score).toBeLessThan(
      scorePassword("Frog9!LanternQuartz").score,
    );
  });
});

describe("uppercase, number and symbol are mandatory", () => {
  it.each([
    ["Froglamp9", "a symbol"],
    ["Froglamp!", "a number"],
    ["froglamp9!", "an uppercase letter"],
  ])("refuses %s for want of %s", (password, missing) => {
    const result = scorePassword(password);
    expect(result.score).toBe(0);
    expect(result.reasons[0]).toBe(`Add ${missing}.`);
  });

  it("names every missing requirement at once", () => {
    expect(scorePassword("froglampjump").reasons[0]).toBe(
      "Add an uppercase letter, a number and a symbol.",
    );
  });

  it("accepts the moment the last requirement is added", () => {
    expect(scorePassword("Froglamp9").acceptable).toBe(false);
    expect(scorePassword("Froglamp9!").acceptable).toBe(true);
  });

  it("reports each requirement's state for the checklist", () => {
    expect(scorePassword("froglamp").checks).toEqual({
      length: true,
      uppercase: false,
      number: false,
      symbol: false,
    });
    expect(scorePassword("Froglamp9!").checks).toEqual({
      length: true,
      uppercase: true,
      number: true,
      symbol: true,
    });
  });

  it("counts any non-alphanumeric as a symbol, including a space", () => {
    expect(scorePassword("Frog9 Lantern").acceptable).toBe(true);
  });
});

describe("the password must not contain its owner", () => {
  const user = {
    email: "priya.sharma@nedyway.test",
    first_name: "Priya",
    last_name: "Sharma",
  };

  it.each([
    ["priya-sharma-99", "the full name"],
    ["Sharma!Sharma1", "the surname"],
    ["xxPRIYAxx1234", "the first name, cased differently"],
    ["pr1ya-secure-99", "the first name in leetspeak"],
    ["nedyway-forever-1", "the mail domain"],
  ])("refuses %s (%s)", (password) => {
    const result = scorePassword(password, user);
    expect(result.score).toBe(0);
    expect(result.reasons[0]).toMatch(/name or email/i);
  });

  it("still accepts an unrelated password for the same user", () => {
    expect(scorePassword("Tr0ub4dour&3xkcd", user).acceptable).toBe(true);
  });

  it("ignores tokens under three characters", () => {
    const li = { email: "li@nedyway.test", first_name: "Li", last_name: "Li" };
    expect(identityTokens(li)).not.toContain("li");
    expect(scorePassword("Delightful-Li0ns", li).acceptable).toBe(true);
  });

  it("scores the same password differently for a different person", () => {
    expect(scorePassword("Priya-Sharma-99", user).score).toBe(0);
    expect(scorePassword("Priya-Sharma-99", {}).acceptable).toBe(true);
  });
});
