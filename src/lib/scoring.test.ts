import {
  scoreAttempt,
  type ScoringQuestion,
  type StudentAnswer,
} from "./scoring";

const opt = (id: string, isCorrect = false) => ({ id, text: `Option ${id}`, isCorrect });

const mcq = (id: string, marks = 2, negativeMarks = 0): ScoringQuestion => ({
  id,
  type: "MCQ",
  marks,
  negativeMarks,
  options: [opt("a"), opt("b", true), opt("c"), opt("d")],
});

const multi = (id: string, marks = 4): ScoringQuestion => ({
  id,
  type: "MULTI_SELECT",
  marks,
  negativeMarks: 0,
  options: [opt("a", true), opt("b", true), opt("c")],
});

const tf = (id: string, marks = 1): ScoringQuestion => ({
  id,
  type: "TRUE_FALSE",
  marks,
  negativeMarks: 0,
  options: [opt("t", true), opt("f")],
});

const shortAnswer = (id: string, marks = 3): ScoringQuestion => ({
  id,
  type: "SHORT_ANSWER",
  marks,
  negativeMarks: 0,
  options: [{ id: `s-${id}`, text: "correct-answer", isCorrect: true }],
});

const coding = (id: string, marks = 5): ScoringQuestion => ({
  id,
  type: "CODING",
  marks,
  negativeMarks: 0,
  options: [],
});

describe("scoreAttempt", () => {
  it("scores a correct MCQ and a wrong one", () => {
    const qs = [mcq("q1"), mcq("q2")];
    const answers: StudentAnswer[] = [
      { questionId: "q1", selectedOptionIds: ["b"] },
      { questionId: "q2", selectedOptionIds: ["a"] },
    ];
    const result = scoreAttempt(qs, answers, 50, false);
    expect(result.score).toBe(2);
    expect(result.maxScore).toBe(4);
    expect(result.percentage).toBe(50);
    expect(result.passed).toBe(true);
  });

  it("gives zero when a question is not answered", () => {
    const result = scoreAttempt([mcq("q1"), mcq("q2")], [{ questionId: "q1", selectedOptionIds: ["b"] }], 50, false);
    expect(result.percentage).toBe(50);
    expect(result.questionResults[1]?.isCorrect).toBe(false);
  });

  it("requires exact set match for MULTI_SELECT", () => {
    const answers: StudentAnswer[] = [{ questionId: "q1", selectedOptionIds: ["a", "b"] }];
    const partialPick = scoreAttempt([multi("q1")], [{ questionId: "q1", selectedOptionIds: ["a"] }], 50, false);
    expect(partialPick.score).toBe(0); // no partial credit
    const full = scoreAttempt([multi("q1")], answers, 50, false);
    expect(full.score).toBe(4);
  });

  it("handles TRUE_FALSE by comparing option id sets", () => {
    const right = scoreAttempt([tf("q1")], [{ questionId: "q1", selectedOptionIds: ["t"] }], 100, false);
    expect(right.passed).toBe(true);
    const wrong = scoreAttempt([tf("q1")], [{ questionId: "q1", selectedOptionIds: ["f"] }], 100, false);
    expect(wrong.score).toBe(0);
  });

  it("normalizes SHORT_ANSWER text (case/whitespace)", () => {
    const result = scoreAttempt(
      [shortAnswer("q1")],
      [{ questionId: "q1", textAnswer: "  CORRECT-Answer  " }],
      50,
      false
    );
    expect(result.score).toBe(3);
  });

  it("marks CODING questions for manual grading and never auto-scores them", () => {
    const result = scoreAttempt([coding("q1")], [{ questionId: "q1", codeAnswer: "print('hi')" }], 50, false);
    expect(result.needsManualGrading).toBe(true);
    expect(result.questionResults[0]?.isCorrect).toBe(null);
    expect(result.score).toBe(0);
  });

  it("applies negative marking on selected-but-wrong objective answers", () => {
    const q = { ...mcq("q1", 2, 1) };
    const result = scoreAttempt([q], [{ questionId: "q1", selectedOptionIds: ["a"] }], 50, true);
    expect(result.questionResults[0]?.marksAwarded).toBe(-1);
    // Negative marks can push a question below zero; the attempt score itself clamps to 0
    expect(result.score).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("negative marking skips entirely blank answers", () => {
    const q = { ...mcq("q1", 2, 1) };
    const result = scoreAttempt([q], [], 50, true);
    expect(result.questionResults[0]?.marksAwarded).toBe(0);
  });

  it("ignores negative marking when disabled", () => {
    const q = { ...mcq("q1", 2, 1) };
    const result = scoreAttempt([q], [{ questionId: "q1", selectedOptionIds: ["a"] }], 50, false);
    expect(result.questionResults[0]?.marksAwarded).toBe(0);
  });

  it("keeps the total score at zero even when negatives outweigh positives", () => {
    const qs = [mcq("a", 2, 5), mcq("b", 2, 5)];
    const result = scoreAttempt(qs, [{ questionId: "a", selectedOptionIds: ["x"] }, { questionId: "b", selectedOptionIds: ["y"] }], 50, true);
    expect(result.score).toBe(0);
    expect(result.percentage).toBe(0);
    // per-question negative marks remain visible for review
    expect(result.questionResults.map((r) => r.marksAwarded)).toEqual([-5, -5]);
  });

  it("returns passed=false when below the passing score", () => {
    const qs = [mcq("q1")];
    const result = scoreAttempt(qs, [{ questionId: "q1", selectedOptionIds: ["a"] }], 80, false);
    expect(result.passed).toBe(false);
  });
});
