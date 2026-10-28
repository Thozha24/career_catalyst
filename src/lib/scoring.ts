import "server-only";

/**
 * Test scoring — computed ONLY on the server from stored question data.
 * Client-reported answers/scores are never trusted.
 */

export type ScoringQuestion = {
  id: string;
  type: "MCQ" | "MULTI_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "CODING";
  marks: number;
  negativeMarks: number;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation?: string | null;
};

export type StudentAnswer = {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string | null;
  codeAnswer?: string | null;
};

export type QuestionResult = {
  questionId: string;
  isCorrect: boolean | null; // null = manually graded (SHORT_ANSWER/CODING)
  marksAwarded: number;
  maxMarks: number;
};

export type ScoreResult = {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  questionResults: QuestionResult[];
  needsManualGrading: boolean;
};

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function scoreAttempt(
  questions: ScoringQuestion[],
  answers: StudentAnswer[],
  passingScorePercent: number,
  negativeMarking: boolean
): ScoreResult {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  const questionResults: QuestionResult[] = [];
  let score = 0;
  let maxScore = 0;
  let needsManualGrading = false;

  for (const q of questions) {
    maxScore += q.marks;
    const answer = answerMap.get(q.id);
    let isCorrect: boolean | null = null;
    let marksAwarded = 0;

    if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
      const selected = (answer?.selectedOptionIds ?? []).slice().sort();
      isCorrect =
        selected.length === correctIds.length && selected.every((id, i) => id === correctIds[i]);
      marksAwarded = isCorrect ? q.marks : 0;
      if (!isCorrect && negativeMarking && selected.length > 0 && q.negativeMarks > 0) {
        marksAwarded = -q.negativeMarks;
      }
    } else if (q.type === "MULTI_SELECT") {
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
      const selected = (answer?.selectedOptionIds ?? []).slice().sort();
      if (selected.length === 0) {
        isCorrect = false;
        marksAwarded = 0;
      } else if (
        selected.length === correctIds.length &&
        selected.every((id, i) => id === correctIds[i])
      ) {
        isCorrect = true;
        marksAwarded = q.marks;
      } else {
        isCorrect = false;
        marksAwarded = negativeMarking && q.negativeMarks > 0 ? -q.negativeMarks : 0;
      }
    } else if (q.type === "SHORT_ANSWER") {
      // Exact/normalized match against option texts marked correct.
      const expected = q.options.filter((o) => o.isCorrect).map((o) => normalize(o.text));
      const given = normalize(answer?.textAnswer ?? "");
      if (given && expected.includes(given)) {
        isCorrect = true;
        marksAwarded = q.marks;
      } else if (given) {
        isCorrect = false;
        marksAwarded = 0;
      } else {
        isCorrect = false;
        marksAwarded = 0;
      }
    } else {
      // CODING: manual/mentor review in this build
      needsManualGrading = true;
      isCorrect = null;
      marksAwarded = 0;
    }

    score += marksAwarded;
    questionResults.push({ questionId: q.id, isCorrect, marksAwarded, maxMarks: q.marks });
  }

  const percentage = maxScore > 0 ? Math.round((Math.max(0, score) / maxScore) * 100) : 0;
  return {
    score: Math.max(0, score),
    maxScore,
    percentage,
    passed: percentage >= passingScorePercent,
    questionResults,
    needsManualGrading,
  };
}
