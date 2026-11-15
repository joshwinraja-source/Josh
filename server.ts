import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Accept up to 50 MB PDF multipart uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.use(express.json({ limit: '25mb' }));

interface CachedPdfSession {
  fileName: string;
  fileSizeBytes: number;
  fileUri?: string;
  inlineBase64?: string;
  createdAt: number;
}

const pdfSessions = new Map<string, CachedPdfSession>();

// Periodically prune cached sessions older than 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [key, val] of pdfSessions.entries()) {
    if (val.createdAt < cutoff) {
      pdfSessions.delete(key);
    }
  }
}, 15 * 60 * 1000).unref();

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in server environment. Add it in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function languageInstruction(lang: string): string {
  if (lang === 'ta') {
    return 'Respond strictly in clear, natural, student-friendly Tamil (தமிழ் Unicode script). Include English technical terms in parentheses when helpful for academic clarity.';
  }
  return 'Respond strictly in clear, student-friendly, well-structured English.';
}

function handleGeminiError(res: express.Response, error: any, fallbackMessage: string) {
  console.error('Gemini API error:', error);
  const status = error?.status || error?.code;
  const msg = error?.message || fallbackMessage;
  if (status === 403 || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
    return res.status(403).json({
      error: 'Gemini API key is missing or invalid. Please check Settings > Secrets.',
    });
  }
  if (status === 429 || msg.includes('RESOURCE_EXHAUSTED')) {
    return res.status(429).json({
      error: 'AI request rate limit reached. Please wait a moment and try again.',
    });
  }
  return res.status(500).json({ error: msg || fallbackMessage });
}

async function preparePdfPart(
  ai: GoogleGenAI,
  buffer: Buffer,
  fileName: string
): Promise<{ part: any; fileUri?: string; inlineBase64?: string }> {
  // Use Gemini Files API for larger PDFs (> 6 MB) so up to 50 MB PDFs work fast & reliably
  if (buffer.length > 6 * 1024 * 1024) {
    const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' });
    let uploaded = await ai.files.upload({
      file: blob,
      config: {
        mimeType: 'application/pdf',
        displayName: fileName,
      },
    });

    // Wait briefly if file is still processing
    let attempts = 0;
    while (uploaded.state === 'PROCESSING' && uploaded.name && attempts < 20) {
      await new Promise((r) => setTimeout(r, 800));
      uploaded = await ai.files.get({ name: uploaded.name });
      attempts += 1;
    }

    if (uploaded.state === 'FAILED') {
      throw new Error('Gemini could not process this PDF file. Please verify the PDF is valid.');
    }

    return {
      part: {
        fileData: {
          fileUri: uploaded.uri!,
          mimeType: 'application/pdf',
        },
      },
      fileUri: uploaded.uri,
    };
  }

  const inlineBase64 = buffer.toString('base64');
  return {
    part: {
      inlineData: {
        mimeType: 'application/pdf',
        data: inlineBase64,
      },
    },
    inlineBase64,
  };
}

function getCachedPdfPart(sessionId?: string, fallbackBase64?: string): any | null {
  if (sessionId && pdfSessions.has(sessionId)) {
    const s = pdfSessions.get(sessionId)!;
    if (s.fileUri) {
      return {
        fileData: {
          fileUri: s.fileUri,
          mimeType: 'application/pdf',
        },
      };
    }
    if (s.inlineBase64) {
      return {
        inlineData: {
          mimeType: 'application/pdf',
          data: s.inlineBase64,
        },
      };
    }
  }
  if (fallbackBase64) {
    const cleanBase64 = fallbackBase64.includes(',')
      ? fallbackBase64.split(',')[1]
      : fallbackBase64;
    return {
      inlineData: {
        mimeType: 'application/pdf',
        data: cleanBase64,
      },
    };
  }
  return null;
}

const SUMMARY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Clean academic/document title.' },
    tldr: {
      type: Type.STRING,
      description: 'One-sentence student-friendly hook summarizing the entire PDF.',
    },
    executiveSummary: {
      type: Type.STRING,
      description: 'Clear, structured overview grounded strictly in the PDF.',
    },
    keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Ordered key study points extracted from the PDF.',
    },
    concepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          explanation: { type: Type.STRING },
          example: {
            type: Type.STRING,
            description: 'Concrete example or context from the PDF if present.',
          },
        },
        required: ['term', 'explanation'],
      },
      description: 'Core terms, definitions, and flashcard concepts from the PDF.',
    },
    formulasAndFacts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Important dates, formulas, laws, equations, or key factual takeaways from the PDF.',
    },
    studyTakeaways: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Practical exam preparation and revision takeaways.',
    },
    suggestedQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '4 thoughtful study questions grounded in this PDF.',
    },
  },
  required: [
    'title',
    'tldr',
    'executiveSummary',
    'keyPoints',
    'concepts',
    'formulasAndFacts',
    'studyTakeaways',
    'suggestedQuestions',
  ],
};

function buildSummaryPrompt(fileName: string, mode: string, language: string): string {
  const modePrompt =
    mode === 'concise'
      ? 'Create a fast, ultra-clear executive overview (2 crisp paragraphs), 5 essential study points, and 4 flashcard concepts.'
      : mode === 'bullets'
      ? 'Create a high-yield revision bullet breakdown highlighting core concepts, definitions, formulas/facts, and exam-ready takeaways.'
      : 'Create thorough, student-friendly exam study notes covering every major section of the PDF, detailed key points, 6-8 flashcard concepts with examples from the text, important facts/formulas, and practical revision takeaways.';

  return `Analyze the attached PDF document ("${fileName}"). ${modePrompt}
Base every single fact, term, formula, and example strictly on the PDF content—never invent external claims.
${languageInstruction(language)}`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'JOSH PDF', maxFileMb: 50 });
});

// Upload multipart PDF (up to 50 MB) + Summarize in one round-trip, caching file reference for fast Q&A & Quiz
app.post('/api/joshpdf/upload-summarize', (req, res) => {
  upload.single('pdf')(req, res, async (uploadErr: any) => {
    if (uploadErr) {
      if (uploadErr.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(413)
          .json({ error: 'PDF exceeds the 50 MB upload limit. Please choose a file under 50 MB.' });
      }
      return res.status(400).json({ error: uploadErr.message || 'Upload error.' });
    }

    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'Please attach a PDF file.' });
      }
      const mode = String(req.body?.mode || 'detailed');
      const language = String(req.body?.language || 'en');
      const ai = getGeminiClient();

      const prepared = await preparePdfPart(ai, file.buffer, file.originalname);
      const sessionId = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      pdfSessions.set(sessionId, {
        fileName: file.originalname,
        fileSizeBytes: file.size,
        fileUri: prepared.fileUri,
        inlineBase64: prepared.inlineBase64,
        createdAt: Date.now(),
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            prepared.part,
            { text: buildSummaryPrompt(file.originalname, mode, language) },
          ],
        },
        config: {
          thinkingConfig: {
            thinkingLevel:
              mode === 'detailed' ? ThinkingLevel.HIGH : ThinkingLevel.LOW,
          },
          systemInstruction:
            'You are JOSH PDF, a highly accurate, student-friendly academic study assistant. Break down complex PDF material clearly, strictly grounded in the uploaded document.',
          responseMimeType: 'application/json',
          responseSchema: SUMMARY_RESPONSE_SCHEMA,
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ sessionId, summary: parsed });
    } catch (error: any) {
      handleGeminiError(res, error, 'Failed to analyze uploaded PDF.');
    }
  });
});

// Regenerate / Summarize using cached sessionId or base64 fallback
app.post('/api/joshpdf/summarize', async (req, res) => {
  try {
    const {
      sessionId,
      pdfBase64,
      fileName = 'Document.pdf',
      mode = 'detailed',
      language = 'en',
    } = req.body || {};

    const pdfPart = getCachedPdfPart(sessionId, pdfBase64);
    if (!pdfPart) {
      return res.status(400).json({ error: 'PDF session expired. Please re-upload your PDF.' });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [pdfPart, { text: buildSummaryPrompt(fileName, mode, language) }],
      },
      config: {
        thinkingConfig: {
          thinkingLevel:
            mode === 'detailed' ? ThinkingLevel.HIGH : ThinkingLevel.LOW,
        },
        systemInstruction:
          'You are JOSH PDF, a highly accurate, student-friendly academic study assistant. Break down complex PDF material clearly, strictly grounded in the uploaded document.',
        responseMimeType: 'application/json',
        responseSchema: SUMMARY_RESPONSE_SCHEMA,
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (error: any) {
    handleGeminiError(res, error, 'Failed to summarize PDF.');
  }
});

// Fast SSE Streaming Document Q&A (uses cached sessionId so zero re-upload overhead!)
app.post('/api/joshpdf/ask-stream', async (req, res) => {
  try {
    const {
      sessionId,
      pdfBase64,
      question,
      history = [],
      language = 'en',
    } = req.body || {};

    const pdfPart = getCachedPdfPart(sessionId, pdfBase64);
    if (!pdfPart || !question?.trim()) {
      return res
        .status(400)
        .json({ error: 'Active PDF and a question are required.' });
    }

    const ai = getGeminiClient();

    const conversationContext = Array.isArray(history)
      ? history
          .slice(-6)
          .map((m: any) => `${m.role === 'user' ? 'Student' : 'JOSH PDF'}: ${m.content}`)
          .join('\n')
      : '';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await ai.models.generateContentStream({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          pdfPart,
          {
            text: `${
              conversationContext ? `Recent study conversation:\n${conversationContext}\n\n` : ''
            }Answer the student's question clearly and accurately using ONLY information present in the attached PDF document. Use helpful bullet points or short paragraphs when appropriate, cite section titles or topics from the PDF if visible, and if the PDF does not contain the answer, clearly state that. ${languageInstruction(
              language
            )}\n\nStudent Question: ${question.trim()}`,
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        systemInstruction:
          'You are JOSH PDF Study Tutor. Be clear, encouraging, accurate, and strictly faithful to the uploaded PDF.',
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Streaming Q&A error:', error);
    if (!res.headersSent) {
      handleGeminiError(res, error, 'Failed to stream answer.');
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
});

// Interactive Quiz Generator (uses cached sessionId)
app.post('/api/joshpdf/quiz', async (req, res) => {
  try {
    const {
      sessionId,
      pdfBase64,
      count = 5,
      difficulty = 'medium',
      language = 'en',
    } = req.body || {};

    const pdfPart = getCachedPdfPart(sessionId, pdfBase64);
    if (!pdfPart) {
      return res.status(400).json({ error: 'PDF session expired. Please re-upload your PDF.' });
    }

    const questionCount = Math.min(10, Math.max(3, Number(count) || 5));
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          pdfPart,
          {
            text: `Generate exactly ${questionCount} multiple-choice questions at "${difficulty}" difficulty based strictly on the attached PDF document. Each question must have 4 distinct options, the 0-based index of the single correct option, and a clear explanation referencing the PDF content. ${languageInstruction(
              language
            )}`,
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        systemInstruction:
          'You are JOSH PDF Quiz Generator. Generate accurate, educational multiple-choice questions strictly from the provided PDF.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{"questions":[]}').trim());
    res.json(parsed);
  } catch (error: any) {
    handleGeminiError(res, error, 'Failed to generate quiz.');
  }
});

// Vite / Static Frontend Serving
async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  const runningUnderTsx = process.execArgv.some((arg) => arg.includes('tsx'));
  const useProductionStatic =
    process.env.NODE_ENV === 'production' ||
    (!runningUnderTsx && process.env.NODE_ENV !== 'development' && fs.existsSync(distPath));

  if (!useProductionStatic) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JOSH PDF server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
