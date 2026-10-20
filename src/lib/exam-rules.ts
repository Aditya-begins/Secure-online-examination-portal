import { Question, StudentAnswer, ViolationType } from '../types';

export interface ScoreResult {
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  passStatus: 'pass' | 'fail';
  breakdown: Record<string, {
    isCorrect: boolean;
    marksAwarded: number;
    studentAnswer?: string | string[];
    correctAnswer?: string | string[];
  }>;
}

/**
 * Calculates student score based on objective question types and negative marking.
 */
export function calculateExamScore(
  questions: Question[],
  answers: Record<string, StudentAnswer>,
  passingMarks: number
): ScoreResult {
  let obtainedMarks = 0;
  let totalMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  const breakdown: ScoreResult['breakdown'] = {};

  for (const q of questions) {
    totalMarks += q.marks;
    const ansObj = answers[q.questionId];
    const studentAns = ansObj?.answer;

    if (!studentAns || (Array.isArray(studentAns) && studentAns.length === 0)) {
      unansweredCount++;
      breakdown[q.questionId] = {
        isCorrect: false,
        marksAwarded: 0,
        studentAnswer: undefined,
        correctAnswer: q.correctAnswer,
      };
      continue;
    }

    let isCorrect = false;

    if (q.questionType === 'single_mcq' || q.questionType === 'true_false' || q.questionType === 'short_answer') {
      if (typeof q.correctAnswer === 'string' && typeof studentAns === 'string') {
        isCorrect = q.correctAnswer.trim().toLowerCase() === studentAns.trim().toLowerCase();
      }
    } else if (q.questionType === 'multiple_mcq') {
      if (Array.isArray(q.correctAnswer) && Array.isArray(studentAns)) {
        const sortedCorrect = [...q.correctAnswer].map(s => s.trim().toLowerCase()).sort();
        const sortedStudent = [...studentAns].map(s => s.trim().toLowerCase()).sort();
        isCorrect = sortedCorrect.length === sortedStudent.length &&
          sortedCorrect.every((val, idx) => val === sortedStudent[idx]);
      }
    } else {
      // Descriptive question - objective auto-grade marks 0 pending manual review
      isCorrect = false;
    }

    if (isCorrect) {
      obtainedMarks += q.marks;
      correctCount++;
      breakdown[q.questionId] = {
        isCorrect: true,
        marksAwarded: q.marks,
        studentAnswer: studentAns,
        correctAnswer: q.correctAnswer,
      };
    } else {
      const penalty = q.negativeMarks ?? 0;
      obtainedMarks -= penalty;
      incorrectCount++;
      breakdown[q.questionId] = {
        isCorrect: false,
        marksAwarded: -penalty,
        studentAnswer: studentAns,
        correctAnswer: q.correctAnswer,
      };
    }
  }

  // Ensure score doesn't fall below zero
  obtainedMarks = Math.max(0, Math.round(obtainedMarks * 100) / 100);
  const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 1000) / 10 : 0;
  const passStatus: 'pass' | 'fail' = obtainedMarks >= passingMarks ? 'pass' : 'fail';

  return {
    obtainedMarks,
    totalMarks,
    percentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    passStatus,
    breakdown,
  };
}

/**
 * Two-warning violation engine:
 * Warning 1: First confirmed violation
 * Warning 2: Second confirmed violation (Final warning)
 * Warning 3: Automatic submission triggered
 */
export function evaluateViolationAction(
  currentWarningCount: number,
  maxWarnings: number = 2
): {
  newWarningCount: number;
  actionTaken: 'warning_1' | 'warning_2' | 'auto_submitted';
  message: string;
  isAutoSubmit: boolean;
} {
  const newCount = currentWarningCount + 1;

  if (newCount === 1) {
    return {
      newWarningCount: 1,
      actionTaken: 'warning_1',
      message: 'Warning 1/2: Suspicious activity detected. Please look directly at the screen and adhere to exam regulations.',
      isAutoSubmit: false,
    };
  }

  if (newCount === 2) {
    return {
      newWarningCount: 2,
      actionTaken: 'warning_2',
      message: 'Warning 2/2: Final warning! Another violation will automatically lock and submit your examination.',
      isAutoSubmit: false,
    };
  }

  return {
    newWarningCount: newCount,
    actionTaken: 'auto_submitted',
    message: 'Your examination has been automatically submitted after repeated examination-rule violations.',
    isAutoSubmit: true,
  };
}

/**
 * Debounces violation events to ensure individual momentary glitches or repeated rapid triggers do not multiply warnings.
 */
export function shouldDebounceViolation(
  lastViolationTimeMs: number,
  currentTimeMs: number,
  debounceWindowMs: number = 8000
): boolean {
  return currentTimeMs - lastViolationTimeMs < debounceWindowMs;
}

/**
 * Calculates remaining time given an authoritative deadline.
 */
export function calculateTimeRemaining(deadlineMs: number, nowMs: number) {
  const diffMs = Math.max(0, deadlineMs - nowMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isExpired = diffMs <= 0;
  const isTenMinutesLeft = !isExpired && totalSeconds <= 600 && totalSeconds > 300;
  const isFiveMinutesLeft = !isExpired && totalSeconds <= 300 && totalSeconds > 60;
  const isOneMinuteLeft = !isExpired && totalSeconds <= 60;

  const formatted = hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    totalSeconds,
    hours,
    minutes,
    seconds,
    isExpired,
    isTenMinutesLeft,
    isFiveMinutesLeft,
    isOneMinuteLeft,
    formatted,
  };
}

/**
 * Question palette state summary.
 */
export function computeQuestionPaletteCounts(
  questions: Question[],
  answers: Record<string, StudentAnswer>,
  visitedQuestionIds: Set<string>
) {
  let answered = 0;
  let markedForReview = 0;
  let notAnswered = 0;
  let notVisited = 0;

  for (const q of questions) {
    const isVisited = visitedQuestionIds.has(q.questionId);
    const ans = answers[q.questionId];
    const hasAnswer = ans && ans.answer !== '' && (!Array.isArray(ans.answer) || ans.answer.length > 0);

    if (ans?.isMarkedForReview) {
      markedForReview++;
    } else if (hasAnswer) {
      answered++;
    } else if (isVisited) {
      notAnswered++;
    } else {
      notVisited++;
    }
  }

  return {
    total: questions.length,
    answered,
    markedForReview,
    notAnswered,
    notVisited,
  };
}
