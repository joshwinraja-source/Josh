import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  FileText,
  FlaskConical,
  HelpCircle,
  Layers,
  List,
  Printer,
  RefreshCw,
  RotateCw,
  Send,
  Sparkles,
  Upload,
  XCircle,
  Zap,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations.ts';
import {
  AppLanguage,
  QaMessage,
  SavedDocument,
  SummaryMode,
} from '../types.ts';
import {
  exportMarkdownFile,
  exportQaPdf,
  exportQuizPdf,
  exportSummaryPdf,
} from '../utils/pdfExport.ts';
import { JoshLogo } from './JoshLogo.tsx';

interface WorkspaceViewProps {
  doc: SavedDocument;
  sessionId: string | null;
  pdfBlobUrl: string | null;
  language: AppLanguage;
  isRegenerating: boolean;
  onLanguageChange: (lang: AppLanguage) => void;
  onModeChange: (mode: SummaryMode) => void;
  onUpdateDoc: (updated: SavedDocument) => void;
  onUploadNew: () => void;
}

type WorkspaceTab = 'summary' | 'qa' | 'quiz' | 'preview';

function renderInlineFormatting(text: string, isUser = false): React.ReactNode[] {
  const safe = text || '';
  const tokens = safe.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong
          key={idx}
          className={`font-semibold ${isUser ? 'text-white' : 'text-[#F8FAFC]'}`}
        >
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={idx} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className={`px-1.5 py-0.5 rounded font-mono text-[0.9em] ${
            isUser
              ? 'bg-white/15 text-white'
              : 'bg-slate-800 text-[#93C5FD] border border-slate-700/60'
          }`}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

const FormattedStudyText: React.FC<{ content: string; isUser?: boolean }> = ({
  content,
  isUser = false,
}) => {
  const lines = (content || '').split(/\r?\n/);
  return (
    <div className="space-y-1.5 break-words">
      {lines.map((rawLine, i) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          return <div key={i} className="h-1.5" aria-hidden="true" />;
        }
        const headingMatch = line.match(/^#{1,4}\s+(.*)$/);
        if (headingMatch) {
          return (
            <h4
              key={i}
              className={`font-display font-bold text-sm pt-1 ${
                isUser ? 'text-white' : 'text-[#F8FAFC]'
              }`}
            >
              {renderInlineFormatting(headingMatch[1], isUser)}
            </h4>
          );
        }
        const bulletMatch = line.match(/^\s*[-*•]\s+(.*)$/);
        if (bulletMatch) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span
                aria-hidden="true"
                className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${
                  isUser ? 'bg-white/90' : 'bg-[#60A5FA]'
                }`}
              />
              <span className="flex-1">
                {renderInlineFormatting(bulletMatch[1], isUser)}
              </span>
            </div>
          );
        }
        const numMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span
                className={`font-mono-nums text-xs font-bold shrink-0 mt-0.5 ${
                  isUser ? 'text-blue-100' : 'text-[#60A5FA]'
                }`}
              >
                {numMatch[1]}.
              </span>
              <span className="flex-1">
                {renderInlineFormatting(numMatch[2], isUser)}
              </span>
            </div>
          );
        }
        return <p key={i}>{renderInlineFormatting(line, isUser)}</p>;
      })}
    </div>
  );
};

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  doc,
  sessionId,
  pdfBlobUrl,
  language,
  isRegenerating,
  onLanguageChange,
  onModeChange,
  onUpdateDoc,
  onUploadNew,
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('summary');
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Flashcards vs List state for Concepts
  const [conceptViewMode, setConceptViewMode] = useState<'flashcards' | 'list'>('flashcards');
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  // Streaming Q&A state
  const [questionInput, setQuestionInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [qaError, setQaError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quiz state
  const [quizCount, setQuizCount] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'challenging'>(
    'medium'
  );
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    setFlippedCards({});
  }, [doc.id, doc.mode, doc.language]);

  useEffect(() => {
    if (activeTab === 'qa') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [doc.qaHistory.length, streamingAnswer, activeTab]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleCopySummary = async () => {
    const text = [
      doc.summary?.title || doc.fileName,
      ...(doc.summary?.tldr ? ['', `${t.tldrLabel}: ${doc.summary.tldr}`] : []),
      '',
      doc.summary?.executiveSummary || '',
      '',
      ...(doc.summary?.keyPoints || []).map((p, idx) => `${idx + 1}. ${p}`),
      '',
      ...(doc.summary?.concepts || []).map(
        (c) => `${c.term}: ${c.explanation}${c.example ? ` (Example: ${c.example})` : ''}`
      ),
      ...(doc.summary?.formulasAndFacts && doc.summary.formulasAndFacts.length > 0
        ? ['', t.formulasAndFacts, ...doc.summary.formulasAndFacts.map((f) => `• ${f}`)]
        : []),
    ].join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFlashcard = (idx: number) => {
    setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAskQuestion = async (qText: string) => {
    const trimmed = qText.trim();
    if (!trimmed || asking) return;
    if (!sessionId) {
      setQaError(
        language === 'ta'
          ? 'கேள்வி கேட்க PDF கோப்பை மீண்டும் பதிவேற்றவும்.'
          : 'Please re-upload the PDF file to run live streaming Q&A on this saved summary.'
      );
      return;
    }

    setQaError(null);
    setAsking(true);
    setStreamingAnswer('');
    setQuestionInput('');

    const userMsg: QaMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...doc.qaHistory, userMsg];
    onUpdateDoc({ ...doc, qaHistory: nextHistory });

    try {
      const res = await fetch('/api/joshpdf/ask-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          question: trimmed,
          history: doc.qaHistory,
          language,
        }),
      });

      if (!res.ok) {
        const rawErr = await res.text();
        let errMessage = 'Failed to get answer';
        try {
          errMessage = JSON.parse(rawErr).error || errMessage;
        } catch {
          // Keep default error
        }
        throw new Error(errMessage);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Streaming response unavailable.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        const processEventBlock = (event: string) => {
          const lines = event.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            const payload = JSON.parse(jsonStr);
            if (payload.error) {
              throw new Error(payload.error);
            }
            if (payload.text) {
              accumulated += payload.text;
              setStreamingAnswer(accumulated);
            }
          }
        };

        for (const event of events) {
          try {
            processEventBlock(event);
          } catch (err: any) {
            if (err?.message && event.includes('"error"')) {
              throw err;
            }
          }
        }
      }

      if (buffer.trim()) {
        try {
          for (const line of buffer.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const payload = JSON.parse(line.slice(6).trim());
            if (payload.text) {
              accumulated += payload.text;
            }
          }
        } catch {
          // Ignore incomplete trailing fragment
        }
      }

      const finalText =
        accumulated.trim() ||
        (language === 'ta'
          ? 'பதில் பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
          : 'No response generated. Please try rephrasing your question.');

      const aiMsg: QaMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: finalText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      onUpdateDoc({
        ...doc,
        qaHistory: [...nextHistory, aiMsg],
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setQaError(err.message || 'Unable to answer question.');
    } finally {
      setStreamingAnswer('');
      setAsking(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!sessionId) {
      setQuizError(
        language === 'ta'
          ? 'புதிய வினாடி வினா உருவாக்க PDF கோப்பை மீண்டும் பதிவேற்றவும்.'
          : 'Please re-upload the PDF file to generate a new quiz.'
      );
      return;
    }
    setQuizError(null);
    setGeneratingQuiz(true);
    setSelectedAnswers({});
    setQuizSubmitted(false);

    try {
      const res = await fetch('/api/joshpdf/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          count: quizCount,
          difficulty: quizDifficulty,
          language,
        }),
      });
      const raw = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error('Invalid server response while generating quiz.');
      }
      if (!res.ok) throw new Error(data.error || 'Quiz generation failed');

      onUpdateDoc({
        ...doc,
        quizQuestions: data.questions || [],
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setQuizError(err.message || 'Unable to generate quiz.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleCheckQuiz = () => {
    setQuizSubmitted(true);
    const score = doc.quizQuestions.reduce(
      (acc, q, idx) => (selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc),
      0
    );
    onUpdateDoc({
      ...doc,
      lastQuizScore: { score, total: doc.quizQuestions.length },
      updatedAt: new Date().toISOString(),
    });
  };

  const quizScore = doc.quizQuestions.reduce(
    (acc, q, idx) => (selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc),
    0
  );

  const quickStudyPrompts = [
    {
      label: t.qaQuickExplain,
      prompt:
        language === 'ta'
          ? 'இந்தப் பாடத்தின் முக்கிய கருத்தை ஒரு மாணவருக்கு எளிமையாக உதாரணத்துடன் விளக்குங்கள்.'
          : 'Explain the main topic of this document in very simple student-friendly language with an example from the text.',
    },
    {
      label: t.qaQuickExam,
      prompt:
        language === 'ta'
          ? 'இந்தப் பாடத்திலிருந்து தேர்வுக்கான 5-மதிப்பெண் கட்டமைக்கப்பட்ட பதிலை எழுதுங்கள்.'
          : 'Write a structured 5-mark exam answer summarizing the most important topic in this document with clear headings and bullet points.',
    },
    {
      label: t.qaQuickFacts,
      prompt:
        language === 'ta'
          ? 'தேர்வுக்கு நினைவில் கொள்ள வேண்டிய முக்கிய தேதிகள், சூத்திரங்கள் மற்றும் வரையறைகளைப் பட்டியலிடுங்கள்.'
          : 'List the most important definitions, dates, formulas, and key facts to memorize from this document for an exam.',
    },
  ];

  const concepts = doc.summary?.concepts || [];
  const suggestedQuestions = doc.summary?.suggestedQuestions || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Dark Glassmorphic Document Toolbar */}
      <div className="no-print glass-panel rounded-2xl p-4 sm:p-5 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#2563EB]/20 border border-blue-500/30 text-[#60A5FA] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-lg font-bold text-[#F8FAFC] truncate">
              {doc.summary?.title || doc.fileName}
            </h1>
            <p className="text-xs text-[#94A3B8] truncate">
              <span>{doc.fileName}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono-nums">{formatSize(doc.fileSizeBytes)}</span>
              <span aria-hidden="true"> · </span>
              <span>{language === 'ta' ? 'தமிழ்' : 'English'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Study Mode Switcher */}
          <div className="glass-subtle inline-flex items-center p-1 rounded-xl">
            {(
              [
                { id: 'concise', label: t.modeConcise },
                { id: 'detailed', label: t.modeDetailed },
                { id: 'bullets', label: t.modeBullets },
              ] as { id: SummaryMode; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={isRegenerating || !sessionId}
                onClick={() => onModeChange(m.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 ${
                  doc.mode === m.id
                    ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/30'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-blue-600/25"
            >
              <Download className="w-4 h-4" />
              <span>{t.exportMenu}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0F172A]/95 backdrop-blur-xl rounded-xl border border-slate-700/80 shadow-2xl py-1.5 z-30">
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    exportSummaryPdf(doc.summary, doc.fileName, language);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#F8FAFC] hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#60A5FA]" />
                  <span>{t.exportSummaryPdf}</span>
                </button>
                {doc.quizQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      exportQuizPdf(doc.quizQuestions, doc.fileName, language);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#F8FAFC] hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-[#60A5FA]" />
                    <span>{t.exportQuizPdf}</span>
                  </button>
                )}
                {doc.qaHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      exportQaPdf(doc.qaHistory, doc.fileName, language);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#F8FAFC] hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-[#60A5FA]" />
                    <span>{t.exportQaPdf}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    exportMarkdownFile(
                      doc.summary,
                      doc.qaHistory,
                      doc.quizQuestions,
                      doc.fileName
                    );
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#F8FAFC] hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#60A5FA]" />
                  <span>{t.exportMarkdown}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    window.print();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#F8FAFC] hover:bg-slate-800/80 flex items-center gap-2.5 cursor-pointer border-t border-slate-800 mt-1 pt-2.5"
                >
                  <Printer className="w-4 h-4 text-[#60A5FA]" />
                  <span>{t.printPdf}</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onUploadNew}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-[#93C5FD] text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            <span>{t.newUpload}</span>
          </button>
        </div>
      </div>

      {/* Split Workspace Grid */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left PDF Preview Pane (Desktop) */}
        <div className="hidden lg:block lg:col-span-5 glass-panel rounded-2xl overflow-hidden sticky top-24">
          <div className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between bg-slate-900/50">
            <span className="text-xs font-semibold text-[#F8FAFC]">{t.tabPreview}</span>
            <span className="text-xs text-[#94A3B8] truncate max-w-[200px]">
              {doc.fileName}
            </span>
          </div>
          {pdfBlobUrl ? (
            <iframe
              src={pdfBlobUrl}
              title={doc.fileName}
              className="w-full h-[660px] border-0 bg-slate-900"
            />
          ) : (
            <div className="h-[460px] flex flex-col items-center justify-center p-8 text-center">
              <FileText className="w-10 h-10 text-[#60A5FA] mb-3" />
              <p className="text-sm font-semibold text-[#F8FAFC]">{doc.fileName}</p>
              <p className="mt-2 text-xs text-[#94A3B8] max-w-xs">{t.pdfViewerFallback}</p>
            </div>
          )}
        </div>

        {/* Right AI Study Workspace */}
        <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden">
          {/* Tabs Header */}
          <div className="px-4 pt-3 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-2 bg-slate-900/50">
            <div className="flex items-center gap-1 overflow-x-auto">
              {(
                [
                  { id: 'summary', label: t.tabSummary, icon: Sparkles },
                  { id: 'qa', label: t.tabQa, icon: HelpCircle },
                  { id: 'quiz', label: t.tabQuiz, icon: BookOpen },
                  { id: 'preview', label: t.tabPreview, icon: FileText, mobileOnly: true },
                ] as {
                  id: WorkspaceTab;
                  label: string;
                  icon: React.ComponentType<{ className?: string }>;
                  mobileOnly?: boolean;
                }[]
              ).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      tab.mobileOnly ? 'lg:hidden' : ''
                    } inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-[#3B82F6] text-[#60A5FA] bg-slate-800/60 rounded-t-lg'
                        : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onLanguageChange(language === 'en' ? 'ta' : 'en')}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-700/80 bg-slate-800/80 text-[#F8FAFC] hover:bg-slate-800 cursor-pointer whitespace-nowrap"
              >
                {language === 'en' ? 'தமிழ்' : 'English'}
              </button>
            </div>
          </div>

          {/* TAB 1: STUDY NOTES */}
          {activeTab === 'summary' && (
            <div className="p-6 space-y-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#60A5FA]">
                  {t.brandName} · {doc.mode.toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#F8FAFC] bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-lg cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? t.copied : t.copySummary}</span>
                  </button>
                  {sessionId && (
                    <button
                      type="button"
                      disabled={isRegenerating}
                      onClick={() => onModeChange(doc.mode)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#93C5FD] bg-[#2563EB]/20 hover:bg-[#2563EB]/30 border border-blue-500/30 rounded-lg cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`}
                      />
                      <span>{t.regenerateSummary}</span>
                    </button>
                  )}
                </div>
              </div>

              {isRegenerating ? (
                <div className="py-12 text-center">
                  <div className="w-9 h-9 border-[3px] border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-3 text-sm text-[#94A3B8]">{t.analyzingPdf}</p>
                </div>
              ) : (
                <>
                  {/* TL;DR One-Sentence Hook */}
                  {doc.summary?.tldr && (
                    <div className="rounded-xl bg-[#2563EB]/15 border border-blue-500/35 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#60A5FA] mb-1">
                        <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.tldrLabel}</span>
                      </div>
                      <p className="text-sm sm:text-[15px] font-medium text-[#F8FAFC] leading-relaxed">
                        {renderInlineFormatting(doc.summary.tldr)}
                      </p>
                    </div>
                  )}

                  {/* Chapter Overview */}
                  <div>
                    <h2 className="font-display text-base font-bold text-[#F8FAFC] mb-2">
                      {t.executiveSummary}
                    </h2>
                    <div className="text-sm sm:text-[15px] text-[#E2E8F0] leading-relaxed">
                      <FormattedStudyText content={doc.summary?.executiveSummary || ''} />
                    </div>
                  </div>

                  {/* Key Study Points */}
                  <div className="pt-5 border-t border-slate-800/80">
                    <h2 className="font-display text-base font-bold text-[#F8FAFC] mb-3">
                      {t.keyPoints}
                    </h2>
                    <ul className="space-y-2.5">
                      {(doc.summary?.keyPoints || []).map((point, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-sm text-[#E2E8F0] leading-relaxed"
                        >
                          <span className="font-mono-nums text-xs font-bold text-[#93C5FD] bg-[#2563EB]/20 border border-blue-500/30 w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{renderInlineFormatting(point)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Terms & Interactive Flashcards */}
                  {concepts.length > 0 && (
                    <div className="pt-5 border-t border-slate-800/80">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                        <h2 className="font-display text-base font-bold text-[#F8FAFC]">
                          {t.coreConcepts}
                        </h2>
                        <div className="glass-subtle inline-flex items-center p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setConceptViewMode('flashcards')}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                              conceptViewMode === 'flashcards'
                                ? 'bg-[#2563EB] text-white'
                                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>{t.flashcardMode}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConceptViewMode('list')}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                              conceptViewMode === 'list'
                                ? 'bg-[#2563EB] text-white'
                                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                            }`}
                          >
                            <List className="w-3.5 h-3.5" />
                            <span>{t.listMode}</span>
                          </button>
                        </div>
                      </div>

                      {conceptViewMode === 'flashcards' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {concepts.map((c, idx) => {
                            const isFlipped = Boolean(flippedCards[idx]);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleFlashcard(idx)}
                                className={`text-left p-4 rounded-xl border transition-colors min-h-[132px] flex flex-col justify-between cursor-pointer ${
                                  isFlipped
                                    ? 'bg-[#1E3A8A]/75 text-white border-[#3B82F6]/60 shadow-lg shadow-blue-950/50'
                                    : 'glass-subtle hover:border-blue-500/50 text-[#F8FAFC]'
                                }`}
                              >
                                {isFlipped ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#93C5FD]">
                                        {c.term}
                                      </span>
                                      <RotateCw className="w-3.5 h-3.5 text-[#93C5FD] shrink-0" />
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                                      {c.explanation}
                                    </p>
                                    {c.example && (
                                      <p className="text-xs text-blue-200 pt-1 border-t border-white/15">
                                        {c.example}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-mono-nums text-xs font-bold text-[#60A5FA]">
                                        #{idx + 1}
                                      </span>
                                      <RotateCw className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                                    </div>
                                    <h3 className="font-display text-sm sm:text-base font-bold text-[#F8FAFC] my-2">
                                      {c.term}
                                    </h3>
                                    <span className="text-[11px] font-medium text-[#94A3B8]">
                                      {t.flipHint}
                                    </span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {concepts.map((c, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-xl glass-subtle"
                            >
                              <h3 className="font-display text-sm font-bold text-[#F8FAFC]">
                                {c.term}
                              </h3>
                              <p className="mt-1 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                                {c.explanation}
                              </p>
                              {c.example && (
                                <p className="mt-2 text-xs text-[#60A5FA] font-medium">
                                  {c.example}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Important Formulas, Dates & Facts */}
                  {doc.summary?.formulasAndFacts && doc.summary.formulasAndFacts.length > 0 && (
                    <div className="pt-5 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 mb-3">
                        <FlaskConical className="w-4 h-4 text-[#60A5FA]" aria-hidden="true" />
                        <h2 className="font-display text-base font-bold text-[#F8FAFC]">
                          {t.formulasAndFacts}
                        </h2>
                      </div>
                      <ul className="space-y-2">
                        {doc.summary.formulasAndFacts.map((item, idx) => (
                          <li
                            key={idx}
                            className="p-3 rounded-xl glass-subtle text-xs sm:text-sm text-[#E2E8F0] leading-relaxed"
                          >
                            {renderInlineFormatting(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Exam & Revision Takeaways */}
                  {(doc.summary?.studyTakeaways || []).length > 0 && (
                    <div className="pt-5 border-t border-slate-800/80">
                      <h2 className="font-display text-base font-bold text-[#F8FAFC] mb-3">
                        {t.studyTakeaways}
                      </h2>
                      <ul className="space-y-2 text-sm text-[#E2E8F0]">
                        {(doc.summary?.studyTakeaways || []).map((takeaway, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
                            <span>{renderInlineFormatting(takeaway)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: STREAMING DOCUMENT Q&A */}
          {activeTab === 'qa' && (
            <div className="p-6 flex flex-col min-h-[540px]">
              {suggestedQuestions.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[#94A3B8] mb-2">
                    {t.suggestedQuestions}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={asking}
                        onClick={() => handleAskQuestion(q)}
                        className="text-left px-3 py-1.5 text-xs font-medium text-[#93C5FD] bg-[#2563EB]/15 hover:bg-[#2563EB]/25 border border-blue-500/25 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 space-y-4 overflow-y-auto max-h-[420px] pr-1">
                {doc.qaHistory.length === 0 && !asking ? (
                  <div className="py-12 text-center border border-dashed border-slate-700/80 rounded-xl glass-subtle">
                    <HelpCircle className="w-8 h-8 text-[#60A5FA] mx-auto mb-2" />
                    <p className="text-sm text-[#94A3B8] max-w-sm mx-auto px-4">
                      {t.qaEmptyHint}
                    </p>
                  </div>
                ) : (
                  doc.qaHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#2563EB] text-white ml-8 shadow-md shadow-blue-950/40'
                          : 'glass-subtle text-[#E2E8F0] mr-4'
                      }`}
                    >
                      <p className="text-[11px] opacity-80 mb-1.5 font-medium">
                        {msg.role === 'user' ? 'You' : 'JOSH PDF'} · {msg.timestamp}
                      </p>
                      <FormattedStudyText
                        content={msg.content}
                        isUser={msg.role === 'user'}
                      />
                    </div>
                  ))
                )}

                {asking && (
                  <div className="p-4 rounded-xl glass-subtle text-sm text-[#E2E8F0] mr-4 leading-relaxed">
                    <p className="text-[11px] text-[#60A5FA] mb-1.5 font-semibold">
                      JOSH PDF · Live
                    </p>
                    {streamingAnswer ? (
                      <FormattedStudyText content={streamingAnswer} />
                    ) : (
                      <p className="text-[#94A3B8]">
                        {language === 'ta'
                          ? 'JOSH PDF ஆவணத்தைப் படிக்கிறது...'
                          : 'JOSH PDF is reading your document...'}
                      </p>
                    )}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {qaError && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/15 border border-red-500/35 text-xs text-red-200">
                  {qaError}
                </div>
              )}

              {/* 1-Tap Student Study Quick Prompts */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                {quickStudyPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={asking || !sessionId}
                    onClick={() => handleAskQuestion(item.prompt)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#E2E8F0] bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskQuestion(questionInput);
                }}
                className="mt-3 flex gap-2.5"
              >
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder={t.qaPlaceholder}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-[#0B1120]/90 border border-slate-700/80 rounded-xl text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]"
                />
                <button
                  type="submit"
                  disabled={asking || !questionInput.trim()}
                  className="min-h-[44px] px-5 py-2.5 bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.askBtn}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: QUIZ GENERATOR */}
          {activeTab === 'quiz' && (
            <div className="p-6 space-y-6">
              <div className="p-4 rounded-xl glass-subtle flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-base font-bold text-[#F8FAFC]">
                    {t.quizConfigTitle}
                  </h2>
                  <div className="mt-2.5 flex flex-wrap items-center gap-3">
                    <label className="text-xs font-medium text-[#94A3B8]">
                      {t.questionCount}:
                      <select
                        value={quizCount}
                        onChange={(e) => setQuizCount(Number(e.target.value))}
                        className="ml-2 px-2.5 py-1.5 bg-[#0B1120] border border-slate-700/80 rounded-lg text-xs font-semibold text-[#F8FAFC]"
                      >
                        <option value={5}>5</option>
                        <option value={8}>8</option>
                        <option value={10}>10</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium text-[#94A3B8]">
                      {t.difficulty}:
                      <select
                        value={quizDifficulty}
                        onChange={(e) =>
                          setQuizDifficulty(
                            e.target.value as 'easy' | 'medium' | 'challenging'
                          )
                        }
                        className="ml-2 px-2.5 py-1.5 bg-[#0B1120] border border-slate-700/80 rounded-lg text-xs font-semibold text-[#F8FAFC]"
                      >
                        <option value="easy">{t.diffEasy}</option>
                        <option value="medium">{t.diffMedium}</option>
                        <option value="challenging">{t.diffHard}</option>
                      </select>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={generatingQuiz}
                  onClick={handleGenerateQuiz}
                  className="min-h-[42px] px-4 py-2 bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold rounded-xl cursor-pointer whitespace-nowrap"
                >
                  {generatingQuiz ? t.generatingQuiz : t.generateQuizBtn}
                </button>
              </div>

              {quizError && (
                <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/35 text-xs text-red-200">
                  {quizError}
                </div>
              )}

              {doc.quizQuestions.length > 0 && (
                <div className="space-y-5">
                  {quizSubmitted && (
                    <div className="p-4 rounded-xl bg-[#2563EB]/15 border border-blue-500/35 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-[#60A5FA]">
                          {t.scoreLabel}
                        </p>
                        <p className="font-mono-nums text-2xl font-bold text-[#F8FAFC]">
                          {quizScore} / {doc.quizQuestions.length}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAnswers({});
                          setQuizSubmitted(false);
                        }}
                        className="px-4 py-2 bg-slate-900 text-[#93C5FD] border border-blue-500/40 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        {t.retakeQuizBtn}
                      </button>
                    </div>
                  )}

                  {doc.quizQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-5 rounded-xl glass-subtle space-y-3"
                    >
                      <h3 className="font-display text-sm sm:text-base font-bold text-[#F8FAFC]">
                        <span className="font-mono-nums text-[#60A5FA] mr-2">
                          {qIdx + 1}.
                        </span>
                        {q.question}
                      </h3>

                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedAnswers[qIdx] === oIdx;
                          const isCorrect = q.correctIndex === oIdx;
                          let style =
                            'bg-slate-900/70 border-slate-700/70 text-[#E2E8F0] hover:border-blue-500/60';
                          if (quizSubmitted) {
                            if (isCorrect) {
                              style = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200';
                            } else if (isSelected && !isCorrect) {
                              style = 'bg-red-500/15 border-red-500/60 text-red-200';
                            }
                          } else if (isSelected) {
                            style = 'bg-[#2563EB]/25 border-[#3B82F6] text-white';
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              disabled={quizSubmitted}
                              onClick={() =>
                                setSelectedAnswers({ ...selectedAnswers, [qIdx]: oIdx })
                              }
                              className={`w-full text-left px-4 py-3 rounded-xl border text-sm flex items-center justify-between gap-3 transition-colors cursor-pointer ${style}`}
                            >
                              <span>
                                <strong className="font-mono-nums mr-2">
                                  {String.fromCharCode(65 + oIdx)}.
                                </strong>
                                {opt}
                              </span>
                              {quizSubmitted && isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                              {quizSubmitted && isSelected && !isCorrect && (
                                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <p className="text-xs text-[#94A3B8] pt-2 border-t border-slate-800/80">
                          <strong className="text-[#F8FAFC]">Explanation:</strong>{' '}
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}

                  {!quizSubmitted && (
                    <button
                      type="button"
                      onClick={handleCheckQuiz}
                      className="w-full min-h-[46px] py-3 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-sm font-semibold rounded-xl cursor-pointer shadow-md shadow-blue-600/25"
                    >
                      {t.checkAnswersBtn}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MOBILE PDF PREVIEW */}
          {activeTab === 'preview' && (
            <div className="p-4 lg:hidden">
              {pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title={doc.fileName}
                  className="w-full h-[500px] border border-slate-700/80 rounded-xl bg-slate-900"
                />
              ) : (
                <p className="text-sm text-[#94A3B8] py-10 text-center">
                  {t.pdfViewerFallback}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Vector Print-to-PDF Layout (Light Print Safe) */}
      <div className="hidden print:block p-8 space-y-6 text-[#172554]">
        <div className="flex items-center justify-between border-b-2 border-[#172554] pb-4">
          <JoshLogo darkText showTagline />
          <span className="text-xs text-[#64748B]">{doc.fileName}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#172554]">{doc.summary?.title}</h1>
          {doc.summary?.tldr && (
            <p className="mt-2 text-sm font-semibold text-[#2563EB]">
              {t.tldrLabel}: {doc.summary.tldr}
            </p>
          )}
          <p className="mt-2 text-sm leading-relaxed">{doc.summary?.executiveSummary}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#2563EB] mb-2">{t.keyPoints}</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {(doc.summary?.keyPoints || []).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
        {concepts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-[#2563EB] mb-2">{t.coreConcepts}</h2>
            <ul className="space-y-1.5 text-sm">
              {concepts.map((c, i) => (
                <li key={i}>
                  <strong>{c.term}:</strong> {c.explanation}
                  {c.example ? ` (${c.example})` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        {doc.summary?.formulasAndFacts && doc.summary.formulasAndFacts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-[#2563EB] mb-2">{t.formulasAndFacts}</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {doc.summary.formulasAndFacts.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
