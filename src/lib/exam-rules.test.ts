import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExamScore,
  evaluateViolationAction,
  shouldDebounceViolation,
  calculateTimeRemaining,
  computeQuestionPaletteCounts
} from './exam-rules';
import { Question, StudentAnswer } from '../types';

test('calculateExamScore correctly grades MCQ, True/False, and negative marking', () => {
  const sampleQuestions: Question[] = [
    {
      questionId: 'q1',
      examId: 'e1',
      questionText: 'What is the default port for HTTPS?',
      questionType: 'single_mcq',
      options: ['80', '443', '8080', '22'],
      correctAnswer: '443',
      marks: 4,
      negativeMarks: 1,
      difficulty: 'easy',
      subject: 'Security',
    },
    {
      questionId: 'q2',
      examId: 'e1',
      questionText: 'AES is an asymmetric encryption algorithm.',
      questionType: 'true_false',
      options: ['True', 'False'],
      correctAnswer: 'False',
      marks: 3,
      negativeMarks: 1,
      difficulty: 'easy',
      subject: 'Security',
    },
    {
      questionId: 'q3',
      examId: 'e1',
      questionText: 'Select all symmetric ciphers.',
      questionType: 'multiple_mcq',
      options: ['AES', 'DES', 'RSA', 'ChaCha20'],
      correctAnswer: ['AES', 'DES', 'ChaCha20'],
      marks: 5,
      negativeMarks: 2,
      difficulty: 'medium',
      subject: 'Security',
    },
    {
      questionId: 'q4',
      examId: 'e1',
      questionText: 'Unanswered question',
      questionType: 'single_mcq',
      correctAnswer: 'A',
      marks: 2,
      difficulty: 'easy',
      subject: 'Security',
    }
  ];

  const answers: Record<string, StudentAnswer> = {
    q1: { questionId: 'q1', answer: '443', savedAt: '2026-10-20T12:00:00Z' }, // +4
    q2: { questionId: 'q2', answer: 'True', savedAt: '2026-10-20T12:01:00Z' }, // -1
    q3: { questionId: 'q3', answer: ['ChaCha20', 'AES', 'DES'], savedAt: '2026-10-20T12:02:00Z' }, // +5
  };

  const result = calculateExamScore(sampleQuestions, answers, 7);
  // Total marks = 4 + 3 + 5 + 2 = 14
  // Obtained = 4 - 1 + 5 = 8
  assert.equal(result.obtainedMarks, 8);
  assert.equal(result.totalMarks, 14);
  assert.equal(result.correctCount, 2);
  assert.equal(result.incorrectCount, 1);
  assert.equal(result.unansweredCount, 1);
  assert.equal(result.passStatus, 'pass'); // 8 >= 7 passing marks
});

test('evaluateViolationAction enforces strict two-warning then auto-submit policy', () => {
  const v1 = evaluateViolationAction(0);
  assert.equal(v1.newWarningCount, 1);
  assert.equal(v1.actionTaken, 'warning_1');
  assert.equal(v1.isAutoSubmit, false);

  const v2 = evaluateViolationAction(1);
  assert.equal(v2.newWarningCount, 2);
  assert.equal(v2.actionTaken, 'warning_2');
  assert.equal(v2.isAutoSubmit, false);

  const v3 = evaluateViolationAction(2);
  assert.equal(v3.newWarningCount, 3);
  assert.equal(v3.actionTaken, 'auto_submitted');
  assert.equal(v3.isAutoSubmit, true);
});

test('shouldDebounceViolation suppresses repeated bursts within debounce window', () => {
  const now = 100000;
  assert.equal(shouldDebounceViolation(now - 3000, now, 8000), true);
  assert.equal(shouldDebounceViolation(now - 9000, now, 8000), false);
});

test('calculateTimeRemaining accurately flags warnings and expiry', () => {
  const now = 1700000000000;
  
  // 9 minutes left
  const nineMin = calculateTimeRemaining(now + 9 * 60 * 1000, now);
  assert.equal(nineMin.isTenMinutesLeft, true);
  assert.equal(nineMin.isFiveMinutesLeft, false);
  assert.equal(nineMin.isExpired, false);
  assert.equal(nineMin.formatted, '09:00');

  // 45 seconds left
  const fortyFiveSec = calculateTimeRemaining(now + 45 * 1000, now);
  assert.equal(fortyFiveSec.isOneMinuteLeft, true);
  assert.equal(fortyFiveSec.isExpired, false);

  // Expired
  const expired = calculateTimeRemaining(now - 1000, now);
  assert.equal(expired.isExpired, true);
  assert.equal(expired.totalSeconds, 0);
});

test('computeQuestionPaletteCounts accurately segments question states', () => {
  const questions: Question[] = [
    { questionId: 'q1', examId: 'e1', questionText: 'Q1', questionType: 'single_mcq', marks: 1, difficulty: 'easy', subject: 'Math' },
    { questionId: 'q2', examId: 'e1', questionText: 'Q2', questionType: 'single_mcq', marks: 1, difficulty: 'easy', subject: 'Math' },
    { questionId: 'q3', examId: 'e1', questionText: 'Q3', questionType: 'single_mcq', marks: 1, difficulty: 'easy', subject: 'Math' },
    { questionId: 'q4', examId: 'e1', questionText: 'Q4', questionType: 'single_mcq', marks: 1, difficulty: 'easy', subject: 'Math' },
  ];

  const answers: Record<string, StudentAnswer> = {
    q1: { questionId: 'q1', answer: 'A', savedAt: '' },
    q2: { questionId: 'q2', answer: '', savedAt: '', isMarkedForReview: true },
  };

  const visited = new Set(['q1', 'q2', 'q3']); // q4 not visited

  const counts = computeQuestionPaletteCounts(questions, answers, visited);
  assert.equal(counts.answered, 1);
  assert.equal(counts.markedForReview, 1);
  assert.equal(counts.notAnswered, 1);
  assert.equal(counts.notVisited, 1);
});
