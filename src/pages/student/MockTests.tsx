import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Zap,
  Target,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { dbStore } from '../../services/store';
import { useAuth } from '../../services/auth';
import { MockTest } from '../../types';
import confetti from 'canvas-confetti';

interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  topic: string;
}

const SAMPLE_PRACTICE_BANK: PracticeQuestion[] = [
  {
    id: 'pq_1',
    question: 'Which HTTP method is idempotent and used to replace an entire resource?',
    options: ['POST', 'PUT', 'PATCH', 'CONNECT'],
    correct: 'PUT',
    explanation: 'PUT replaces the entire targeted resource and produces the same result on identical repeated requests (idempotency).',
    topic: 'Web Architecture',
  },
  {
    id: 'pq_2',
    question: 'In asymmetric cryptography, which key is used by a sender to encrypt a confidential message for a recipient?',
    options: ['Sender\'s Private Key', 'Recipient\'s Public Key', 'Sender\'s Public Key', 'Shared Diffie-Hellman Key'],
    correct: 'Recipient\'s Public Key',
    explanation: 'Messages encrypted with the recipient\'s public key can only be decrypted by the recipient\'s corresponding private key.',
    topic: 'Cryptography',
  },
  {
    id: 'pq_3',
    question: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (AVL / Red-Black)?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correct: 'O(log n)',
    explanation: 'Balanced BSTs maintain a height proportional to log(n), guaranteeing O(log n) lookups.',
    topic: 'Data Structures',
  },
  {
    id: 'pq_4',
    question: 'Which of the following database isolation levels prevents phantom reads?',
    options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
    correct: 'Serializable',
    explanation: 'Serializable isolation is the highest ANSI SQL level, preventing dirty reads, non-repeatable reads, and phantoms using range locks or multiversion serializable snapshot isolation.',
    topic: 'Databases',
  },
  {
    id: 'pq_5',
    question: 'In Docker containers, what Linux kernel primitive provides process isolation and limits CPU/Memory utilization?',
    options: ['Cgroups (Control Groups)', 'Namespaces only', 'Systemd daemons', 'IPTables rules'],
    correct: 'Cgroups (Control Groups)',
    explanation: 'Cgroups enforce hardware resource limits (CPU, RAM, I/O), while Namespaces provide visibility isolation (PID, NET, MNT).',
    topic: 'Cloud & Containers',
  },
  {
    id: 'pq_6',
    question: 'Which sorting algorithm has a worst-case time complexity of O(n log n) and is guaranteed to be stable?',
    options: ['QuickSort', 'HeapSort', 'MergeSort', 'SelectionSort'],
    correct: 'MergeSort',
    explanation: 'MergeSort splits arrays recursively and merges sorted halves with guaranteed O(n log n) operations and stable ordering.',
    topic: 'Algorithms',
  },
  {
    id: 'pq_7',
    question: 'What type of DNS record maps a domain name to an IPv6 address?',
    options: ['A Record', 'AAAA Record', 'CNAME Record', 'MX Record'],
    correct: 'AAAA Record',
    explanation: 'A records map to 32-bit IPv4 addresses, while AAAA (quad-A) records map to 128-bit IPv6 addresses.',
    topic: 'Networking',
  },
  {
    id: 'pq_8',
    question: 'Which design pattern restricts the instantiation of a class to one single instance across an application lifecycle?',
    options: ['Factory Pattern', 'Singleton Pattern', 'Observer Pattern', 'Strategy Pattern'],
    correct: 'Singleton Pattern',
    explanation: 'The Singleton pattern provides a single globally accessible point of reference to a single instance.',
    topic: 'Software Design',
  },
];

export const MockTests: React.FC = () => {
  const { currentUser } = useAuth();
  const pastMocks = dbStore.getMockTests(currentUser?.userId);

  const [mode, setMode] = useState<'selection' | 'running' | 'summary'>('selection');
  const [selectedPreset, setSelectedPreset] = useState<'quick' | 'timed' | 'full' | 'custom'>('quick');

  // Running test state
  const [activeQuestions, setActiveQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(15 * 60);

  // Result summary state
  const [lastResult, setLastResult] = useState<MockTest | null>(null);

  const startPractice = (type: 'quick' | 'timed' | 'full' | 'custom') => {
    setSelectedPreset(type);
    let qCount = 5;
    let timeMinutes = 10;

    if (type === 'quick') {
      qCount = 4;
      timeMinutes = 8;
    } else if (type === 'timed') {
      qCount = 6;
      timeMinutes = 12;
    } else {
      qCount = SAMPLE_PRACTICE_BANK.length;
      timeMinutes = 20;
    }

    const shuffled = [...SAMPLE_PRACTICE_BANK].sort(() => 0.5 - Math.random()).slice(0, qCount);
    setActiveQuestions(shuffled);
    setCurrentIndex(0);
    setUserAnswers({});
    setTimeSpentSeconds(0);
    setTimerRemaining(timeMinutes * 60);
    setMode('running');
  };

  const handleSelectOption = (opt: string) => {
    const q = activeQuestions[currentIndex];
    setUserAnswers(prev => ({ ...prev, [q.id]: opt }));
  };

  const finishPractice = () => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    activeQuestions.forEach(q => {
      const ans = userAnswers[q.id];
      if (!ans) unanswered++;
      else if (ans === q.correct) correct++;
      else incorrect++;
    });

    const total = activeQuestions.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const score = correct * 2; // 2 marks per question
    const totalMarks = total * 2;

    const mockRecord: MockTest = {
      mockTestId: `mock_${Date.now()}`,
      studentId: currentUser?.userId || 'usr_student_1',
      subject: 'Computer Science Core Concepts',
      topic: 'Mixed Syllabus Revision',
      difficulty: selectedPreset === 'quick' ? 'easy' : selectedPreset === 'timed' ? 'medium' : 'hard',
      durationMinutes: Math.max(1, Math.ceil(timeSpentSeconds / 60)),
      score,
      totalMarks,
      accuracy,
      totalQuestions: total,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      unansweredQuestions: unanswered,
      completedAt: new Date().toISOString(),
    };

    dbStore.saveMockTest(mockRecord);
    setLastResult(mockRecord);
    setMode('summary');

    if (accuracy >= 75) {
      confetti({ particleCount: 70, spread: 60 });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Practice Mode Selection */}
      {mode === 'selection' && (
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 mb-2">
              <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Un-proctored Practice Environment
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mock Test Practice Module</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Strengthen conceptual understanding without formal proctoring surveillance. Immediate answer explanations, accuracy diagnostics, and improvement recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => startPractice('quick')}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 shadow-sm hover:shadow-md cursor-pointer transition group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Practice</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">4 quick revision questions to sharpen recall.</p>
              <span className="inline-block text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-3">Start 8-Min Session →</span>
            </div>

            <div
              onClick={() => startPractice('timed')}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 shadow-sm hover:shadow-md cursor-pointer transition group"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Timed Mock Test</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Paced evaluation with active timer constraints.</p>
              <span className="inline-block text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-3">Start 12-Min Session →</span>
            </div>

            <div
              onClick={() => startPractice('full')}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 shadow-sm hover:shadow-md cursor-pointer transition group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Full-Length Mock</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Comprehensive coverage of all syllabus modules.</p>
              <span className="inline-block text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-3">Start Full Mock →</span>
            </div>

            <div
              onClick={() => startPractice('custom')}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 shadow-sm hover:shadow-md cursor-pointer transition group"
            >
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Custom Practice</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select topic, difficulty level, and question volume.</p>
              <span className="inline-block text-[11px] text-teal-600 dark:text-teal-400 font-bold mt-3">Configure Practice →</span>
            </div>
          </div>

          {/* Past Practice History */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Past Mock Test Attempts</h3>
            <div className="space-y-2.5">
              {pastMocks.map(m => (
                <div
                  key={m.mockTestId}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{m.subject}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {new Date(m.completedAt).toLocaleDateString()} • {m.durationMinutes} mins • {m.totalQuestions} Questions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-blue-600 dark:text-blue-400">{m.score}/{m.totalMarks} ({m.accuracy}%)</p>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {m.correctAnswers} Correct • {m.incorrectAnswers} Incorrect
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Active Running Practice Test */}
      {mode === 'running' && activeQuestions.length > 0 && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              Practice Question {currentIndex + 1} of {activeQuestions.length}
            </span>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Question {currentIndex + 1}/{activeQuestions.length}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <p className="text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
              {activeQuestions[currentIndex].question}
            </p>

            <div className="space-y-3">
              {activeQuestions[currentIndex].options.map((opt, i) => {
                const isSelected = userAnswers[activeQuestions[currentIndex].id] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white font-bold' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(i => i - 1)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30"
              >
                Previous
              </button>

              {currentIndex < activeQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(i => i + 1)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={finishPractice}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Complete Practice
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Post-Practice Diagnostic Summary */}
      {mode === 'summary' && lastResult && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Practice Session Diagnostic Complete</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Score: <span className="font-bold text-blue-600 dark:text-blue-400">{lastResult.score} / {lastResult.totalMarks}</span> ({lastResult.accuracy}% Accuracy)
            </p>

            <div className="grid grid-cols-4 gap-2 my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Total Qs</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">{lastResult.totalQuestions}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Correct</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{lastResult.correctAnswers}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Incorrect</p>
                <p className="text-base font-bold text-red-600 dark:text-red-400">{lastResult.incorrectAnswers}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Unanswered</p>
                <p className="text-base font-bold text-slate-500 dark:text-slate-400">{lastResult.unansweredQuestions}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setMode('selection')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Return to Mock Tests
              </button>
              <button
                onClick={() => startPractice(selectedPreset)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Try Again (New Random Set)
              </button>
            </div>
          </div>

          {/* Question Explanations */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Question Explanations & Key Insights</h3>
            <div className="space-y-4">
              {activeQuestions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isCorrect = userAns === q.correct;
                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">Q{idx + 1}: {q.question}</span>
                      {isCorrect ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Your answer: <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>{userAns || 'None'}</span> • Correct: <span className="text-blue-600 dark:text-blue-400 font-semibold">{q.correct}</span>
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                      💡 <strong className="text-slate-900 dark:text-white">Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
