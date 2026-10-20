import React, { useState } from 'react';
import {
  PlusCircle,
  Trash2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Settings,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { dbStore } from '../../services/store';
import { useAuth } from '../../services/auth';
import { Exam, Question, QuestionType } from '../../types';

interface ExamBuilderProps {
  onNavigate: (route: string) => void;
}

export const ExamBuilder: React.FC<ExamBuilderProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  // Exam Details Form
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passingMarks, setPassingMarks] = useState(20);
  const [enableCamera, setEnableCamera] = useState(true);
  const [enableMic, setEnableMic] = useState(true);
  const [enableScreenShare, setEnableScreenShare] = useState(true);
  const [maxWarnings, setMaxWarnings] = useState(2);
  const [answerDisclosure, setAnswerDisclosure] = useState<'immediate' | 'after_deadline' | 'never'>('immediate');

  // Questions Array
  const [questions, setQuestions] = useState<Question[]>([]);

  // New Question Form state
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuestionType>('single_mcq');
  const [optionsStr, setOptionsStr] = useState('Option A, Option B, Option C, Option D');
  const [correctAnswer, setCorrectAnswer] = useState('Option A');
  const [marks, setMarks] = useState(5);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [notification, setNotification] = useState('');

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const options = (qType === 'single_mcq' || qType === 'multiple_mcq')
      ? optionsStr.split(',').map(s => s.trim()).filter(Boolean)
      : qType === 'true_false'
      ? ['True', 'False']
      : undefined;

    const newQuestion: Question = {
      questionId: `q_custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      examId: '', // populated on save
      questionText: qText,
      questionType: qType,
      options,
      correctAnswer: qType === 'multiple_mcq' ? [correctAnswer] : correctAnswer,
      explanation,
      marks: Number(marks),
      negativeMarks: Number(negativeMarks),
      difficulty,
      subject,
    };

    setQuestions(prev => [...prev, newQuestion]);

    // Reset question form
    setQText('');
    setExplanation('');
    setNotification('Question added to examination draft.');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.questionId !== id));
  };

  const handleSaveExam = () => {
    if (!title.trim()) {
      alert('Please enter an Examination Title.');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question to the examination.');
      return;
    }

    const examId = `exam_${Date.now()}`;
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    const updatedQuestions = questions.map(q => ({
      ...q,
      examId,
    }));

    const newExam: Exam = {
      examId,
      title,
      subject,
      description: description || 'Official proctored institutional examination.',
      instructions: [
        'Webcam, microphone, and screen monitoring are active throughout the session.',
        'A two-warning policy is enforced: on the 3rd confirmed violation, the exam auto-submits.',
        'Responses are automatically saved on every change.',
      ],
      durationMinutes: Number(durationMinutes),
      totalMarks,
      passingMarks: Number(passingMarks),
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      allowedAttempts: 1,
      proctoringPolicy: {
        enableCamera,
        enableMicrophone: enableMic,
        enableScreenShare,
        maxWarnings: Number(maxWarnings),
        noiseSensitivity: 'medium',
        headPoseSensitivity: 'medium',
        enforceFullscreen: true,
        trackTabSwitch: true,
      },
      resultPublicationPolicy: 'immediate',
      answerDisclosurePolicy: answerDisclosure,
      createdBy: currentUser?.userId || 'usr_admin_1',
      status: 'published',
      questionCount: updatedQuestions.length,
      questions: updatedQuestions,
    };

    dbStore.saveExam(newExam);
    updatedQuestions.forEach(q => dbStore.saveQuestion(q));

    dbStore.logAuditEvent({
      actorId: currentUser?.userId || 'admin',
      actorName: currentUser?.fullName || 'Administrator',
      actorRole: 'admin',
      action: 'EXAM_CREATED',
      targetId: examId,
      targetType: 'Exam',
      details: `Created and published examination "${title}" with ${updatedQuestions.length} questions.`,
    });

    alert('Examination successfully published and added to student portal!');
    onNavigate('/admin/exams');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Examination Builder & Question Studio</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure examination metadata, proctoring violation parameters, and author questions.
          </p>
        </div>

        <button
          onClick={handleSaveExam}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Publish Examination ({questions.length} Qs)</span>
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 font-medium">
          {notification}
        </div>
      )}

      {/* 1. Exam Configuration Form */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>General Exam Parameters</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Examination Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. NET-301: Cryptographic Protocols & Network Defense"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Subject / Domain *</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Cybersecurity, Cloud Computing"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Duration (Minutes)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Passing Marks</label>
            <input
              type="number"
              value={passingMarks}
              onChange={e => setPassingMarks(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Answer Disclosure</label>
            <select
              value={answerDisclosure}
              onChange={e => setAnswerDisclosure(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="immediate">Immediate on Submission</option>
              <option value="after_deadline">After Exam Deadline</option>
              <option value="never">Keep Concealed (Official)</option>
            </select>
          </div>
        </div>

        {/* Proctoring Switches */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Proctoring Safeguards Configuration:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={enableCamera}
                onChange={e => setEnableCamera(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-200 font-medium">Face & Gaze Camera</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={enableMic}
                onChange={e => setEnableMic(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-200 font-medium">Audio Level Detection</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={enableScreenShare}
                onChange={e => setEnableScreenShare(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-200 font-medium">Screen Sharing Enforced</span>
            </label>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-300">Max Warnings:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">2 (3rd Auto-Submits)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Question Authoring Studio */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Add Question to Bank</span>
        </h3>

        <form onSubmit={handleAddQuestion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Question Type</label>
              <select
                value={qType}
                onChange={e => setQType(e.target.value as QuestionType)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              >
                <option value="single_mcq">Single-Choice MCQ</option>
                <option value="multiple_mcq">Multiple-Choice MCQ</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
                <option value="descriptive">Descriptive Question</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Marks Awarded</label>
              <input
                type="number"
                value={marks}
                onChange={e => setMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Negative Marks</label>
              <input
                type="number"
                value={negativeMarks}
                onChange={e => setNegativeMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">Question Statement *</label>
            <textarea
              required
              rows={3}
              value={qText}
              onChange={e => setQText(e.target.value)}
              placeholder="e.g. Which consensus mechanism ensures Byzantine Fault Tolerance with high performance?"
              className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          {(qType === 'single_mcq' || qType === 'multiple_mcq') && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
                Options (Comma-separated) *
              </label>
              <input
                type="text"
                value={optionsStr}
                onChange={e => setOptionsStr(e.target.value)}
                placeholder="Option A, Option B, Option C, Option D"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Correct Answer Reference *</label>
              <input
                type="text"
                required
                value={correctAnswer}
                onChange={e => setCorrectAnswer(e.target.value)}
                placeholder="Must match the correct option verbatim"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Explanation / Solution Notes</label>
              <input
                type="text"
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                placeholder="Educational rationale shown after answer disclosure"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Question to Exam</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Current Questions in Draft List */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Examination Question List ({questions.length})</span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">
            Total Marks: {questions.reduce((sum, q) => sum + q.marks, 0)}
          </span>
        </h3>

        {questions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No questions added yet. Use the question studio above to author items.
          </p>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.questionId}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start justify-between gap-4 text-xs"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 dark:text-white">Q{idx + 1}.</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase font-semibold">
                    {q.questionType.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">+{q.marks} Marks</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 mt-0.5">{q.questionText}</p>
                {q.options && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Options: {q.options.join(' | ')}
                  </p>
                )}
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono font-medium">
                  Correct Answer: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                </p>
              </div>

              <button
                onClick={() => handleDeleteQuestion(q.questionId)}
                className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                title="Remove question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
