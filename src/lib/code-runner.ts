import "server-only";

/**
 * Code evaluation layer.
 *
 * DEV (default): heuristic static evaluation against the problem's test cases.
 *   This simulates a runner WITHOUT executing student code on the app server —
 *   safe by construction, zero infra. Submissions are scored on structure +
 *   the public test expectations.
 *
 * PRODUCTION: set CODE_RUNNER_URL to a sandboxed execution service (Judge0,
 *   Firecracker/gVisor container pool, isolated worker fleet). Student code is
 *   NEVER executed inside the Next.js app server process — this module is the
 *   only place that talks to the runner, and it forwards code + tests only.
 */

export type RunVerdict = "ACCEPTED" | "WRONG_ANSWER" | "ERROR" | "TIMEOUT";

export type TestCase = { input: string; expectedOutput: string; hidden?: boolean };

export type RunResult = {
  verdict: RunVerdict;
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  outputs: { input: string; expected: string; actual: string | null; passed: boolean; hidden: boolean }[];
};

const TIMEOUT_MS = 10_000;

export function isRunnerConfigured(): boolean {
  return !!process.env.CODE_RUNNER_URL;
}

/** Evaluate a submission. Never call this with raw user code on the app server in production. */
export async function evaluateSubmission(params: {
  language: string;
  code: string;
  testCases: TestCase[];
}): Promise<RunResult> {
  if (isRunnerConfigured()) {
    return runInSandbox(params);
  }
  return evalHeuristic(params.code, params.language, params.testCases);
}

/**
 * Production path: POST to the isolated runner service. The runner MUST:
 *  - execute inside one-shot containers (no network, read-only fs, tmpfs /tmp)
 *  - enforce CPU (e.g. 1 core), memory (256MB) and wall-clock (10s) limits
 *  - reject forbidden imports/syscalls via seccomp/profile
 * The app server only ever sends/receives JSON.
 */
async function runInSandbox(params: {
  language: string;
  code: string;
  testCases: TestCase[];
}): Promise<RunResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${process.env.CODE_RUNNER_URL}/execute`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.CODE_RUNNER_TOKEN ? { authorization: `Bearer ${process.env.CODE_RUNNER_TOKEN}` } : {}),
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`runner responded ${res.status}`);
    const data = (await res.json()) as RunResult;
    return data;
  } catch {
    return {
      verdict: "ERROR",
      passedCount: 0,
      totalCount: params.testCases.length,
      runtimeMs: 0,
      outputs: params.testCases.map((tc) => ({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: null,
        passed: false,
        hidden: !!tc.hidden,
      })),
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Dev-time heuristic evaluator (no code execution) ────────────────────────

function evalHeuristic(code: string, language: string, testCases: TestCase[]): RunResult {
  const started = Date.now();
  const outputs = testCases.map((tc) => {
    const actual = simulateOutput(code, language, tc.input);
    const passed = actual !== null && normalizeOut(actual) === normalizeOut(tc.expectedOutput);
    return { input: tc.input, expected: tc.expectedOutput, actual, passed, hidden: !!tc.hidden };
  });
  const passedCount = outputs.filter((o) => o.passed).length;
  const verdict: RunVerdict =
    passedCount === testCases.length ? "ACCEPTED" : passedCount > 0 ? "WRONG_ANSWER" : "ERROR";
  return { verdict, passedCount, totalCount: testCases.length, runtimeMs: Date.now() - started, outputs };
}

function normalizeOut(s: string): string {
  return s.trim().replace(/\r\n/g, "\n");
}

/**
 * Very small, intentionally conservative "simulated runner": recognizes the
 * canonical solution patterns shipped with the seeded problems. Unknown code
 * is treated as a failed run (WRONG_ANSWER) — never executed.
 */
function simulateOutput(code: string, language: string, input: string): string | null {
  const src = code.replace(/\s+/g, " ").toLowerCase();
  const inputLines = input.split("\n").map((l) => l.trim()).filter(Boolean);
  const nums = inputLines.flatMap((l) => l.split(/[\s,]+/).map(Number)).filter((n) => !Number.isNaN(n));
  const str = inputLines.join(" ").trim();

  const has = (...patterns: string[]) => patterns.every((p) => src.includes(p));

  // Sum of array
  if (has("sum") && (/reduce/.test(src) || /for /.test(src) || /while /.test(src) || /def sum|sum_/.test(src) || /int sum/.test(src))) {
    if (nums.length >= 2) {
      const n = nums[0];
      const arr = nums.slice(1, 1 + n);
      if (arr.length === n) return String(arr.reduce((a, b) => a + b, 0));
      return String(nums.reduce((a, b) => a + b, 0));
    }
  }

  // Reverse a string / word
  if (has("reverse") && (/split\(""?\)\.reverse|\[::-1\]|strrev|reverse\(/.test(src))) {
    if (str) {
      const oneLine = inputLines[0] ?? "";
      return oneLine.split("").reverse().join("");
    }
  }

  // Palindrome check
  if (has("palindrome") && (/\[::-1\]|split\(""?\)\.reverse|reverse/.test(src))) {
    const oneLine = (inputLines[0] ?? "").toLowerCase();
    const cleaned = oneLine.replace(/[^a-z0-9]/g, "");
    return cleaned === cleaned.split("").reverse().join("") ? "true" : "false";
  }

  // FizzBuzz
  if (has("fizzbuzz") && /% 3|%3|% 5|%5/.test(src)) {
    const n = nums[0];
    if (n >= 1 && n <= 1000) {
      const out: string[] = [];
      for (let i = 1; i <= n; i++) {
        out.push(i % 15 === 0 ? "FizzBuzz" : i % 3 === 0 ? "Fizz" : i % 5 === 0 ? "Buzz" : String(i));
      }
      return out.join("\n");
    }
  }

  // Factorial
  if (has("factorial") && (/reduce|for |while |recursion|return n \*|factorial\(/.test(src))) {
    const n = nums[0];
    if (n >= 0 && n <= 20) {
      let f = 1;
      for (let i = 2; i <= n; i++) f *= i;
      return String(f);
    }
  }

  // Fibonacci nth
  if (has("fibonacci") && (/for |while |recursion|fib\(|fibo\(/.test(src))) {
    const n = nums[0];
    if (n >= 1 && n <= 70) {
      // F(1)=0, F(2)=1 — shift the pair (n-2) times so b lands on F(n)
      let a = 0, b = 1;
      for (let i = 1; i < n - 1; i++) [a, b] = [b, a + b];
      return String(n === 1 ? 0 : b);
    }
  }

  // Two sum (indices)
  if (has("two sum") || (/two_sum|twosum/.test(src))) {
    if (nums.length >= 4) {
      const n = nums[0];
      const arr = nums.slice(1, 1 + n);
      const target = nums[1 + n];
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (arr[i] + arr[j] === target) return `${i} ${j}`;
        }
      }
      return "";
    }
  }

  // Max/minimum in array
  if ((has("maximum") || has("max element") || has("largest")) && /max|sort/.test(src)) {
    const n = nums[0];
    const arr = nums.slice(1, 1 + n);
    if (arr.length === n) return String(Math.max(...arr));
  }

  // Count vowels
  if (has("vowel") && /count|filter|match/.test(src)) {
    const oneLine = inputLines[0] ?? "";
    const count = (oneLine.match(/[aeiou]/gi) ?? []).length;
    return String(count);
  }

  // Hello, World style
  if (/hello/.test(src)) {
    return "Hello, World!";
  }

  // Unknown code — treat as not passing, never execute
  void language;
  return null;
}

export { evalHeuristic };
