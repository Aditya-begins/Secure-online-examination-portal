import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Camera,
  Mic,
  Monitor,
  Eye,
  RefreshCw,
  X,
  Sparkles,
  Save,
  Volume2,
} from 'lucide-react';
import { dbStore } from '../../services/store';
import { ProctoringEngine, ProctoringState } from '../../lib/proctoring';
import { calculateTimeRemaining, computeQuestionPaletteCounts } from '../../lib/exam-rules';
import { ExamAttempt, Question, StudentAnswer, ViolationType } from '../../types';
import { useAuth } from '../../services/auth';
import confetti from 'canvas-confetti';

interface ExamSessionProps {
  attemptId: string;
  onNavigate: (route: string) => void;
}

export const ExamSession: React.FC<ExamSessionProps> = ({ attemptId, onNavigate }) => {
  const { currentUser } = useAuth();
  const [attempt, setAttempt] = useState<ExamAttempt | null>(() => dbStore.getAttempt(attemptId) || null);
  const exam = attempt ? dbStore.getExam(attempt.examId) : null;
  const questions: Question[] = exam?.questions || dbStore.getQuestions(attempt?.examId) || [];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>(() => attempt?.answers || {});
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set([questions[0]?.questionId]));
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>('Just now');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Proctoring and Warning State
  const videoPipRef = useRef<HTMLVideoElement>(null);
  const proctorEngineRef = useRef<ProctoringEngine | null>(null);
  const [proctorState, setProctorState] = useState<ProctoringState>({
    isCameraActive: true,
    isMicActive: true,
    isScreenShareActive: true,
    isFullscreen: false,
    audioLevel: 15,
    faceDetected: true,
    headPose: 'centered',
    warningCount: attempt?.warningCount || 0,
  });

  const [activeWarningModal, setActiveWarningModal] = useState<{
    warningNum: number;
    message: string;
    violationType: ViolationType;
  } | null>(null);

  const [timerDisplay, setTimerDisplay] = useState('00:00');
  const [timerAlert, setTimerAlert] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // 1. Initialize Proctoring Engine & Listeners
  useEffect(() => {
    if (!exam || !attempt) return;

    const engine = new ProctoringEngine(exam.proctoringPolicy, attempt.warningCount);
    proctorEngineRef.current = engine;

    engine.setCallbacks(
      (violation, confidence, action, message, newCount) => {
        // Log event to persistent database
        dbStore.logProctoringEvent({
          attemptId: attempt.attemptId,
          studentId: attempt.studentId,
          studentName: attempt.studentName,
          examId: exam.examId,
          examTitle: exam.title,
          eventType: violation,
          timestamp: new Date().toISOString(),
          confidence,
          warningNumber: newCount,
          actionTaken: action,
          reviewStatus: 'pending',
        });

        if (action === 'auto_submitted') {
          // Trigger automatic submission on 3rd violation
          handleAutoSubmit('auto_submitted_violation', message);
        } else {
          setActiveWarningModal({
            warningNum: newCount,
            message,
            violationType: violation,
          });
        }
      },
      newState => {
        setProctorState(newState);
      }
    );

    if (videoPipRef.current) {
      engine.startMonitoring(videoPipRef.current);
    }

    return () => {
      engine.stopMonitoring();
    };
  }, [attempt?.attemptId, exam?.examId]);

  // 2. Server-Authoritative Timer Interval & Warnings
  useEffect(() => {
    if (!attempt) return;
    const deadlineMs = new Date(attempt.deadline).getTime();

    const timer = setInterval(() => {
      const nowMs = Date.now();
      const timeInfo = calculateTimeRemaining(deadlineMs, nowMs);

      setTimerDisplay(timeInfo.formatted);

      if (timeInfo.isExpired) {
        clearInterval(timer);
        handleAutoSubmit('auto_submitted_timeout', 'Examination time limit elapsed. Submitting responses...');
      } else if (timeInfo.isOneMinuteLeft && !timerAlert) {
        setTimerAlert('1 minute remaining! Please finalize your answers.');
      } else if (timeInfo.isFiveMinutesLeft && !timerAlert) {
        setTimerAlert('5 minutes remaining.');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt?.deadline]);

  // 3. Mark Question as Visited when index changes
  useEffect(() => {
    if (currentQuestion) {
      setVisitedQuestions(prev => new Set([...prev, currentQuestion.questionId]));
    }
  }, [currentQuestionIndex]);

  // 4. Autosave logic
  const saveAnswer = (qId: string, value: string | string[], isReview?: boolean) => {
    const isMarked = isReview ?? answers[qId]?.isMarkedForReview ?? false;
    const updatedAnswers: Record<string, StudentAnswer> = {
      ...answers,
      [qId]: {
        questionId: qId,
        answer: value,
        savedAt: new Date().toISOString(),
        isMarkedForReview: isMarked,
      },
    };
    setAnswers(updatedAnswers);

    // Save into dbStore persistent storage immediately
    if (attempt) {
      dbStore.saveStudentAnswer(attempt.attemptId, qId, value, isMarked);
      setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    const currentAns = answers[currentQuestion.questionId];
    const newReviewState = !currentAns?.isMarkedForReview;
    saveAnswer(currentQuestion.questionId, currentAns?.answer || '', newReviewState);
  };

  const clearCurrentResponse = () => {
    if (!currentQuestion) return;
    saveAnswer(currentQuestion.questionId, currentQuestion.questionType === 'multiple_mcq' ? [] : '');
  };

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;

    if (currentQuestion.questionType === 'single_mcq' || currentQuestion.questionType === 'true_false') {
      saveAnswer(currentQuestion.questionId, option);
    } else if (currentQuestion.questionType === 'multiple_mcq') {
      const currentList = (answers[currentQuestion.questionId]?.answer as string[]) || [];
      const updated = currentList.includes(option)
        ? currentList.filter(o => o !== option)
        : [...currentList, option];
      saveAnswer(currentQuestion.questionId, updated);
    }
  };

  // Submit functions
  const handleAutoSubmit = async (reason: 'auto_submitted_timeout' | 'auto_submitted_violation', note: string) => {
    if (!attempt) return;
    setIsSubmitting(true);

    try {
      dbStore.submitAttempt(attempt.attemptId, reason);
      setTimeout(() => {
        onNavigate('/student/results');
      }, 1200);
    } catch {
      onNavigate('/student/results');
    }
  };

  const handleManualSubmit = async () => {
    if (!attempt) return;
    setIsSubmitting(true);

    try {
      dbStore.submitAttempt(attempt.attemptId, 'submitted');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => {
        onNavigate('/student/results');
      }, 1000);
    } catch {
      setIsSubmitting(false);
    }
  };

  // Question counts for palette
  const paletteCounts = computeQuestionPaletteCounts(
    questions,
    answers,
    visitedQuestions
  );

  if (!exam || !attempt) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Examination Attempt Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Please select an accredited examination from the available list.</p>
        <button
          onClick={() => onNavigate('/student/exams')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Session Ribbon */}
      <header className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 sticky top-2 z-30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
            {currentQuestionIndex + 1}
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {exam.title}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>{attempt.studentName} ({currentUser?.studentId || 'STU-2026-9041'})</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Save className="w-3 h-3" /> Autosaved {lastSavedTimestamp}
              </span>
            </p>
          </div>
        </div>

        {/* Timer, Warnings & Submit Button */}
        <div className="flex items-center gap-3">
          {/* Warning Counter Badge */}
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              proctorState.warningCount === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : proctorState.warningCount === 1
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Warnings: {proctorState.warningCount}/2</span>
          </div>

          {/* Countdown Clock */}
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-2 font-mono font-bold text-sm">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{timerDisplay}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* Main Examination Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Question Canvas Area */}
        <div className="lg:col-span-8 space-y-4">
          {timerAlert && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{timerAlert}</span>
              </div>
              <button onClick={() => setTimerAlert(null)} className="text-amber-600 dark:text-amber-400 hover:text-amber-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentQuestion && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 min-h-[500px] flex flex-col justify-between">
              {/* Question Header & Points */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {currentQuestion.questionType.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      +{currentQuestion.marks} Mark{currentQuestion.marks > 1 ? 's' : ''}
                    </span>
                    {(currentQuestion.negativeMarks ?? 0) > 0 && (
                      <span className="text-[10px] text-red-600 dark:text-red-400 ml-1.5 font-medium">
                        (-{currentQuestion.negativeMarks})
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed mb-6">
                  {currentQuestion.questionText}
                </h2>

                {/* Question Options or Input Area */}
                <div className="space-y-3">
                  {currentQuestion.questionType === 'single_mcq' && currentQuestion.options && (
                    currentQuestion.options.map((opt, idx) => {
                      const isSelected = answers[currentQuestion.questionId]?.answer === opt;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectOption(opt)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                            isSelected
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 text-slate-900 dark:text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                              isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs sm:text-sm font-medium">{opt}</span>
                        </div>
                      );
                    })
                  )}

                  {currentQuestion.questionType === 'multiple_mcq' && currentQuestion.options && (
                    currentQuestion.options.map((opt, idx) => {
                      const selectedList = (answers[currentQuestion.questionId]?.answer as string[]) || [];
                      const isChecked = selectedList.includes(opt);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectOption(opt)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                            isChecked
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 text-slate-900 dark:text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                              isChecked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs sm:text-sm font-medium">{opt}</span>
                        </div>
                      );
                    })
                  )}

                  {currentQuestion.questionType === 'true_false' && (
                    <div className="grid grid-cols-2 gap-4">
                      {['True', 'False'].map(opt => {
                        const isSelected = answers[currentQuestion.questionId]?.answer === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectOption(opt)}
                            className={`py-5 rounded-2xl border text-sm font-bold transition flex items-center justify-center gap-2 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                            }`}
                          >
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.questionType === 'short_answer' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={(answers[currentQuestion.questionId]?.answer as string) || ''}
                        onChange={e => saveAnswer(currentQuestion.questionId, e.target.value)}
                        placeholder="Type your concise answer here..."
                        className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  )}

                  {currentQuestion.questionType === 'descriptive' && (
                    <div className="mt-2">
                      <textarea
                        rows={6}
                        value={(answers[currentQuestion.questionId]?.answer as string) || ''}
                        onChange={e => saveAnswer(currentQuestion.questionId, e.target.value)}
                        placeholder="Write your comprehensive technical response..."
                        className="w-full p-4 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 leading-relaxed"
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                        Objective parts auto-evaluated; descriptive responses are reviewed with AI assistance and verified by administrator.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Controls */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMarkForReview}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                      answers[currentQuestion.questionId]?.isMarkedForReview
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>
                      {answers[currentQuestion.questionId]?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
                    </span>
                  </button>

                  <button
                    onClick={clearCurrentResponse}
                    className="px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Clear Response
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(i => i - 1)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    disabled={currentQuestionIndex === questions.length - 1}
                    onClick={() => setCurrentQuestionIndex(i => i + 1)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1"
                  >
                    <span>Save & Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Camera PIP, Proctoring HUD & Question Palette */}
        <div className="lg:col-span-4 space-y-4">
          {/* Camera PIP Viewport */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                AI Proctoring Feed
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                ACTIVE • 30 FPS
              </span>
            </div>

            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-inner">
              <video
                ref={videoPipRef}
                className="w-full h-full object-cover transform -scale-x-100"
                muted
                playsInline
              />

              {/* Target radar HUD */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border border-blue-400/40 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>

              {/* Live telemetry overlay */}
              <div className="absolute bottom-2 inset-x-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-xl text-[9px] flex items-center justify-between border border-slate-200 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Gaze: {proctorState.headPose}</span>
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium">
                  <Volume2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  {proctorState.audioLevel}%
                </span>
                <span className={proctorState.faceDetected ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>
                  {proctorState.faceDetected ? 'Face OK' : 'Absent'}
                </span>
              </div>
            </div>

            {/* Simulated Proctoring Infraction triggers for test reviewer evaluation */}
            <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Integrity Test Triggers (Reviewer Controls)
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => proctorEngineRef.current?.triggerViolation('tab_switched', 0.95)}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 border border-slate-200 dark:border-slate-700 transition"
                  title="Simulate Tab Switch Violation"
                >
                  Tab Switch
                </button>
                <button
                  type="button"
                  onClick={() => proctorEngineRef.current?.simulateHeadPose('looking_left')}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 border border-slate-200 dark:border-slate-700 transition"
                  title="Simulate Looking Away"
                >
                  Look Away
                </button>
                <button
                  type="button"
                  onClick={() => proctorEngineRef.current?.triggerViolation('abnormal_noise', 0.88)}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 hover:text-purple-600 border border-slate-200 dark:border-slate-700 transition"
                  title="Simulate Loud Audio Violation"
                >
                  Loud Audio
                </button>
              </div>
            </div>
          </div>

          {/* Numbered Question Palette */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">Question Palette</h3>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-[8px]" />
                <span>Answered ({paletteCounts.answered})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded bg-amber-500 text-white font-bold flex items-center justify-center text-[8px]" />
                <span>Review ({paletteCounts.markedForReview})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-700" />
                <span>Not Answered ({paletteCounts.notAnswered})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded border border-slate-300 dark:border-slate-600" />
                <span>Not Visited ({paletteCounts.notVisited})</span>
              </div>
            </div>

            {/* Question buttons grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const ans = answers[q.questionId];
                const hasAnswer = ans && ans.answer !== '' && (!Array.isArray(ans.answer) || ans.answer.length > 0);
                const isReview = ans?.isMarkedForReview;
                const isVisited = visitedQuestions.has(q.questionId);

                let btnClass = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400';
                if (isReview) {
                  btnClass = 'bg-amber-500 text-white font-bold border-amber-500';
                } else if (hasAnswer) {
                  btnClass = 'bg-emerald-600 text-white font-bold border-emerald-600';
                } else if (isVisited) {
                  btnClass = 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
                }

                if (isCurrent) {
                  btnClass += ' ring-2 ring-blue-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-900';
                }

                return (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center border ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Alert Modal */}
      {activeWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 sm:p-8 rounded-3xl border border-red-300 dark:border-red-800 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              Proctoring Violation Notice
            </span>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
              Warning {activeWarningModal.warningNum} of 2
            </h3>

            <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              {activeWarningModal.message}
            </p>

            <p className="text-[11px] text-red-600 dark:text-red-400 mt-3 font-semibold">
              {activeWarningModal.warningNum >= 2
                ? 'CRITICAL NOTICE: One more infraction will immediately trigger automatic submission.'
                : 'Please keep your focus squarely on the screen.'}
            </p>

            <button
              onClick={() => setActiveWarningModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-sm"
            >
              I Understand & Resume Examination
            </button>
          </div>
        </div>
      )}

      {/* Manual Submit Confirmation Dialog */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Examination Submission</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Are you sure you want to finalize and lock your exam responses?
            </p>

            <div className="grid grid-cols-3 gap-2 my-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Answered</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{paletteCounts.answered}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Marked Review</p>
                <p className="font-bold text-amber-600 dark:text-amber-400">{paletteCounts.markedForReview}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">Unanswered</p>
                <p className="font-bold text-slate-500 dark:text-slate-400">{paletteCounts.notAnswered + paletteCounts.notVisited}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition"
              >
                Keep Reviewing
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleManualSubmit}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Submit & Lock</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
