/**
 * The password strength rule, mirrored from the server.
 *
 * The authority is `backend/src/services/auth/password-strength.js`. This copy
 * exists so the meter can respond to every keystroke without a round trip, and
 * so the sign-up form refuses a password for the same reason the API would
 * rather than letting somebody fill in a form and submit it to find out.
 *
 * Because it is a copy, it can drift — and a browser that promises a password
 * the server then refuses is worse than no meter at all. The guard is the
 * vector table in `password-strength.test.ts`, which is a byte-identical copy
 * of the one in the backend's `tests/unit/passwordStrength.test.js`. Change a
 * score in one and the other suite goes red.
 *
 * If the two ever disagree at runtime, the server wins: the form's own check
 * is a courtesy, and `useRegister`'s error path still renders whatever the API
 * says.
 */

export const MIN_PASSWORD_LENGTH = 8;
export const MIN_ACCEPTED_SCORE = 2;

export const STRENGTH_LABELS = [
  "Too weak",
  "Weak",
  "Fair",
  "Good",
  "Strong",
] as const;

const COMMON = new Set([
  "password",
  "passwd",
  "pass",
  "secret",
  "letmein",
  "welcome",
  "admin",
  "administrator",
  "root",
  "login",
  "guest",
  "test",
  "changeme",
  "default",
  "qwerty",
  "qwertyuiop",
  "asdfgh",
  "zxcvbn",
  "abc",
  "abcd",
  "iloveyou",
  "monkey",
  "dragon",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "shadow",
  "master",
  "superman",
  "trustno",
  "starwars",
  "whatever",
  "freedom",
  "computer",
  "internet",
  "google",
  "facebook",
  "nedyway",
  "grocery",
  "delivery",
  "india",
  "mumbai",
  "delhi",
]);

const WALKS = [
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
  "1234567890",
  "abcdefghijklmnopqrstuvwxyz",
];

/**
 * Composition is MANDATORY, not scored — see the backend copy for the trade
 * this makes. `id` is what the requirements checklist ticks off.
 */
export const REQUIRED_CLASSES = [
  { id: "uppercase", re: /[A-Z]/, name: "an uppercase letter" },
  { id: "number", re: /[0-9]/, name: "a number" },
  { id: "symbol", re: /[^a-zA-Z0-9]/, name: "a symbol" },
] as const;

export type CheckId = (typeof REQUIRED_CLASSES)[number]["id"] | "length";

const deLeet = (s: string) =>
  s
    .replace(/[@4]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[7]/g, "t");

// Strip the tail BEFORE folding substitutions — the other order is a no-op,
// see the note on the backend copy.
const baseWord = (s: string) => deLeet(s.toLowerCase().replace(/[^a-z]+$/, ""));

const isRepeat = (s: string) => /^(.{1,3}?)\1+$/.test(s);

const isWalk = (s: string) => {
  const lower = s.toLowerCase();
  const back = [...lower].reverse().join("");
  return WALKS.some((walk) => walk.includes(lower) || walk.includes(back));
};

export type Identity = {
  email?: string;
  first_name?: string;
  last_name?: string;
};

export const identityTokens = (user: Identity = {}): string[] =>
  [
    user.email?.split("@")[0],
    user.email?.split("@")[1]?.split(".")[0],
    user.first_name,
    user.last_name,
  ]
    .flatMap((value) => String(value ?? "").split(/[^a-zA-Z0-9]+/))
    .map((token) => token.toLowerCase())
    .filter((token) => token.length >= 3);

export type StrengthResult = {
  score: number;
  label: string;
  reasons: string[];
  acceptable: boolean;
  checks: Record<CheckId, boolean>;
};

export function scorePassword(
  password: string | null | undefined,
  user: Identity = {},
): StrengthResult {
  const value = String(password ?? "");
  const reasons: string[] = [];

  const checks = {
    length: value.length >= MIN_PASSWORD_LENGTH,
  } as Record<CheckId, boolean>;
  for (const { id, re } of REQUIRED_CLASSES) checks[id] = re.test(value);

  const verdict = (score: number): StrengthResult => ({
    score,
    label: STRENGTH_LABELS[score],
    reasons,
    acceptable: score >= MIN_ACCEPTED_SCORE,
    checks,
  });

  if (!checks.length) {
    reasons.push(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
    return verdict(0);
  }

  if (COMMON.has(deLeet(value.toLowerCase()))) {
    reasons.push("This is one of the most commonly used passwords.");
    return verdict(0);
  }

  if (isRepeat(value)) {
    reasons.push("Repeating the same characters doesn't add strength.");
    return verdict(0);
  }

  if (isWalk(value)) {
    reasons.push("Runs of keys like “qwerty” or “12345” are guessed first.");
    return verdict(0);
  }

  const lowered = deLeet(value.toLowerCase());
  if (identityTokens(user).some((token) => lowered.includes(token))) {
    reasons.push("Don't include your name or email address.");
    return verdict(0);
  }

  // After the shape gates, so `password` is told it is a common password
  // rather than told to add a capital.
  const missing = REQUIRED_CLASSES.filter(({ id }) => !checks[id]);
  if (missing.length) {
    const names = missing.map((c) => c.name);
    const list =
      names.length > 1
        ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
        : names[0];
    reasons.push(`Add ${list}.`);
    return verdict(0);
  }

  let score = value.length >= 14 ? 4 : value.length >= 10 ? 3 : 2;

  const stripped = baseWord(value);
  if (stripped !== lowered && COMMON.has(stripped)) {
    reasons.push("Starts with a common word — numbers on the end add little.");
    score -= 2;
  }

  score = Math.max(0, Math.min(4, score));

  if (score < 4 && value.length < 14) {
    reasons.push("Longer is stronger — aim for 14+.");
  }

  return verdict(score);
}
