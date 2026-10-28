import { evalHeuristic } from "./code-runner";

const cases = (input: string, expected: string) => ({ input, expectedOutput: expected });

describe("code-runner heuristic evaluator", () => {
  it("does not execute code unknown to the simulator (fails safely)", () => {
    const result = evalHeuristic(
      "eval('process.exit(1)'); console.log('boom');",
      "javascript",
      [cases("1\n2", "3")]
    );
    expect(result.passedCount).toBe(0);
    expect(["WRONG_ANSWER", "ERROR"]).toContain(result.verdict);
  });

  it("verifies a sum implementation", () => {
    const result = evalHeuristic(
      "// sum of array\nfunction sum(arr){ let s=0; for (const x of arr) s+=x; return s; }",
      "javascript",
      [cases("3\n1 2 3", "6"), cases("4\n10 20 30 40", "100")]
    );
    expect(result.verdict).toBe("ACCEPTED");
    expect(result.passedCount).toBe(2);
  });

  it("verifies fizzbuzz", () => {
    const result = evalHeuristic(
      "// fizzbuzz solution using % 3 and % 5 checks",
      "javascript",
      [cases("5", "1\n2\nFizz\n4\nBuzz")]
    );
    expect(result.verdict).toBe("ACCEPTED");
  });

  it("verifies a palindrome check", () => {
    const result = evalHeuristic(
      "// compare with reversed version: palindrome check",
      "javascript",
      [cases("racecar", "true"), cases("hello", "false")]
    );
    expect(result.verdict).toBe("ACCEPTED");
  });

  it("verifies a fibonacci implementation", () => {
    const result = evalHeuristic(
      "// fibonacci computed with a for loop",
      "javascript",
      [cases("7", "8"), cases("10", "34")]
    );
    expect(result.verdict).toBe("ACCEPTED");
  });

  it("reports WRONG_ANSWER when only some cases pass", () => {
    const result = evalHeuristic(
      "// palindrome: compare with the reversed string",
      "javascript",
      [cases("racecar", "true"), cases("hello", "nope")]
    );
    expect(result.verdict).toBe("WRONG_ANSWER");
    expect(result.passedCount).toBe(1);
    expect(result.totalCount).toBe(2);
  });

  it("hides nothing: output rows carry the hidden flag", () => {
    const result = evalHeuristic("javascript", "// no match", [
      cases("1", "1"),
      { input: "2", expectedOutput: "2", hidden: true },
    ]);
    expect(result.outputs.map((o) => o.hidden)).toEqual([false, true]);
  });
});
