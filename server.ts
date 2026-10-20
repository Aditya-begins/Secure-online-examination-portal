import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize server-side Gemini AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Chatbot endpoint for SecureExam AI Assistant
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, role, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const isStudent = role === 'student';

    const systemInstruction = `You are "SecureExam AI Assistant", the official intelligent assistant for the Secure Online Examination Portal ("Smart Exams. Secure Environment. Intelligent Evaluation.").

Role Boundary: The user interacting with you is currently authenticated as a ${isStudent ? 'STUDENT' : 'ADMINISTRATOR'}.
Context: ${JSON.stringify(context || {})}

Guidelines:
1. Tone: Professional, encouraging, precise, and cybersecurity-aware.
2. ${isStudent ? `For Students:
   - Assist with registration, login, email/phone OTP verification, webcam face enrollment.
   - Explain exam instructions, 2-warning proctoring rules, mock test practice modes, and performance analytics.
   - Answer study preparation and syllabus review questions.
   - SECURITY RULE: NEVER reveal answers or solve questions for an ongoing examination. If an exam is in progress, kindly state that exam assistance is restricted during active proctored sessions.
   - Protect privacy: Do not reveal other students' information.` : `For Administrators:
   - Assist with exam creation, question bank organization, proctoring policy configuration.
   - Interpret proctoring violations (e.g. explain sustained gaze deviation, abnormal audio decibel thresholds, screen sharing interruption).
   - Provide summary metrics on active exams and students.`}
3. Keep answers concise, clear, and actionable. Use bullet points where appropriate.`;

    // If no GEMINI_API_KEY is available, provide intelligent rule-based fallback response
    if (!process.env.GEMINI_API_KEY) {
      let fallbackText = '';
      const lower = message.toLowerCase();

      if (lower.includes('exam') && lower.includes('when')) {
        fallbackText = 'You have an active scheduled examination: **CS-401: Advanced Cloud Architecture & Distributed Systems**. You can take it anytime from the "Available Exams" tab on your dashboard.';
      } else if (lower.includes('mock') || lower.includes('practice')) {
        fallbackText = 'You can access Mock Tests from your sidebar. We offer **Quick Practice** (10 questions), **Timed Mock Test** (25 questions), **Full-Length Mock**, and **Custom Practice** across various subjects.';
      } else if (lower.includes('warning') || lower.includes('proctor')) {
        fallbackText = 'The portal uses a **two-warning policy**: Warning 1 alerts you to suspicious activity. Warning 2 is your final alert. A 3rd confirmed violation will automatically submit your exam. Keep your face centered and stay on the exam tab.';
      } else if (lower.includes('result') || lower.includes('score')) {
        fallbackText = 'You can review completed test scorecards, detailed question analyses, and downloadable PDF reports under the **My Results** tab.';
      } else {
        fallbackText = `Hello! I am your SecureExam AI Assistant. I can assist you with examination schedules, 7-point readiness checks, mock test practice, proctoring policy clarification, and account security. How may I help you today?`;
      }

      return res.json({ response: fallbackText });
    }

    // Call Gemini API with gemini-3.8-flash
    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const responseText = geminiResponse.text || 'I could not generate a response. Please try again.';
    res.json({ response: responseText });
  } catch (error: any) {
    console.error('Gemini API chat error:', error);
    res.status(500).json({
      error: 'Failed to communicate with AI Assistant',
      details: error?.message || 'Internal error',
      response: 'I encountered a temporary connection issue. Please ensure your query is exam-related, or check the help guidelines in the dashboard.'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  // Mount Vite middleware in development
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Secure Online Examination Portal server running at http://localhost:${PORT}`);
  });
}

startServer();
