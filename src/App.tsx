import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { TRANSLATIONS } from './i18n/translations.ts';
import {
  AppLanguage,
  SavedDocument,
  SummaryMode,
  SummaryResult,
} from './types.ts';
import { generateSampleStudyPdf } from './utils/pdfExport.ts';
import { JoshLogo } from './components/JoshLogo.tsx';
import { LoadingScreen } from './components/LoadingScreen.tsx';
import { HomeSection } from './components/HomeSection.tsx';
import { WorkspaceView } from './components/WorkspaceView.tsx';
import { DashboardView } from './components/DashboardView.tsx';

type AppView = 'home' | 'workspace' | 'dashboard';

const STORAGE_KEY = 'josh_pdf_saved_docs_v1';
const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB limit

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Unexpected rendering error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen ambient-canvas flex items-center justify-center p-6 text-[#F8FAFC]">
          <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center space-y-4">
            <JoshLogo size="lg" />
            <p className="text-sm text-[#94A3B8]">
              Something interrupted the workspace view. Resetting restores a clean session.
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-sm font-semibold rounded-xl cursor-pointer"
            >
              Reload JOSH PDF
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('detailed');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed.filter((d) => d && typeof d === 'object' && d.summary)
        : [];
    } catch {
      return [];
    }
  });

  const [activeDoc, setActiveDoc] = useState<SavedDocument | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadingLarge, setUploadingLarge] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDocs));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedDocs]);

  const upsertSavedDoc = (doc: SavedDocument) => {
    setActiveDoc(doc);
    setSavedDocs((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)].slice(0, 25));
  };

  const analyzePdfUpload = async (
    fileOrBlob: File | Blob,
    fileName: string,
    sizeBytes: number,
    blobUrl: string,
    mode: SummaryMode,
    lang: AppLanguage
  ) => {
    setErrorMsg(null);
    setUploadingLarge(sizeBytes > 6 * 1024 * 1024);
    setIsAnalyzing(true);
    setPdfBlobUrl(blobUrl);

    try {
      const formData = new FormData();
      formData.append('pdf', fileOrBlob, fileName);
      formData.append('mode', mode);
      formData.append('language', lang);

      const res = await fetch('/api/joshpdf/upload-summarize', {
        method: 'POST',
        body: formData,
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Server returned an unexpected response. Please try again.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to summarize PDF.');
      }

      setSessionId(data.sessionId || null);

      const newDoc: SavedDocument = {
        id: `doc-${Date.now()}`,
        fileName,
        fileSizeBytes: sizeBytes,
        language: lang,
        mode,
        summary: data.summary as SummaryResult,
        qaHistory: [],
        quizQuestions: [],
        updatedAt: new Date().toISOString(),
      };

      upsertSavedDoc(newDoc);
      setView('workspace');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to process PDF. Please try again.');
      setView('home');
    } finally {
      setIsAnalyzing(false);
      setUploadingLarge(false);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMsg(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg(
        language === 'ta'
          ? 'சரியான PDF (.pdf) கோப்பைத் தேர்ந்தெடுக்கவும்.'
          : 'Please select a valid PDF (.pdf) document.'
      );
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setErrorMsg(
        language === 'ta'
          ? 'PDF கோப்பு 50 MB வரம்பை விடப் பெரியதாக உள்ளது. 50 MB-க்குள் உள்ள கோப்பைத் தேர்ந்தெடுக்கவும்.'
          : 'PDF exceeds the 50 MB size limit. Please choose a file under 50 MB.'
      );
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    analyzePdfUpload(file, file.name, file.size, blobUrl, summaryMode, language);
  };

  const handleLoadSamplePdf = () => {
    const sample = generateSampleStudyPdf();
    analyzePdfUpload(
      sample.blob,
      sample.fileName,
      sample.sizeBytes,
      sample.blobUrl,
      summaryMode,
      language
    );
  };

  const handleRegenerateInWorkspace = async (
    nextMode: SummaryMode,
    nextLang: AppLanguage
  ) => {
    if (!activeDoc || !sessionId) return;
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/joshpdf/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fileName: activeDoc.fileName,
          mode: nextMode,
          language: nextLang,
        }),
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Server returned an unexpected response.');
      }
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate summary.');

      upsertSavedDoc({
        ...activeDoc,
        mode: nextMode,
        language: nextLang,
        summary: data as SummaryResult,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleToggleLanguage = (nextLang: AppLanguage) => {
    setLanguage(nextLang);
    if (view === 'workspace' && activeDoc && sessionId && activeDoc.language !== nextLang) {
      handleRegenerateInWorkspace(activeDoc.mode, nextLang);
    }
  };

  return (
    <AppErrorBoundary>
      <div className="min-h-screen flex flex-col ambient-canvas text-[#F8FAFC]">
        {/* Dark Glassmorphic 3-Zone Top Navigation Bar */}
        <header className="no-print sticky top-0 z-40 glass-nav">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
            {/* Zone 1: Brand Wordmark */}
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setView('home');
              }}
              className="focus-visible:outline-2 focus-visible:outline-[#3B82F6] rounded-lg"
            >
              <JoshLogo size="md" />
            </a>

            {/* Zone 2: Clean Single-Line Nav Links */}
            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center gap-6 text-sm font-medium text-[#94A3B8]"
            >
              <button
                type="button"
                onClick={() => setView('home')}
                className={`hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  view === 'home' ? 'text-[#60A5FA] font-semibold' : ''
                }`}
              >
                {t.navHome}
              </button>
              {activeDoc && (
                <button
                  type="button"
                  onClick={() => setView('workspace')}
                  className={`hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    view === 'workspace' ? 'text-[#60A5FA] font-semibold' : ''
                  }`}
                >
                  {t.navWorkspace}
                </button>
              )}
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className={`hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  view === 'dashboard' ? 'text-[#60A5FA] font-semibold' : ''
                }`}
              >
                {t.navDashboard}
              </button>
            </nav>

            {/* Zone 3: Language Switch + Primary Action */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:inline-flex items-center p-0.5 bg-slate-900/80 border border-slate-700/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleToggleLanguage('en')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    language === 'en'
                      ? 'bg-[#2563EB] text-white'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleLanguage('ta')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    language === 'ta'
                      ? 'bg-[#2563EB] text-white'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  தமிழ்
                </button>
              </div>

              <button
                type="button"
                onClick={() => setView('home')}
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#3B82F6] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-blue-600/25"
              >
                {t.uploadPdfBtn}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                className="md:hidden w-10 h-10 rounded-lg border border-slate-700/80 bg-slate-900/80 flex items-center justify-center text-[#F8FAFC]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[#0B1120]/95 backdrop-blur-xl border-t border-slate-800 px-4 py-3 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setView('home');
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] text-left px-3 py-2 text-sm font-medium text-[#F8FAFC] hover:bg-slate-800/80 rounded-lg"
              >
                {t.navHome}
              </button>
              {activeDoc && (
                <button
                  type="button"
                  onClick={() => {
                    setView('workspace');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] text-left px-3 py-2 text-sm font-medium text-[#F8FAFC] hover:bg-slate-800/80 rounded-lg"
                >
                  {t.navWorkspace}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setView('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] text-left px-3 py-2 text-sm font-medium text-[#F8FAFC] hover:bg-slate-800/80 rounded-lg"
              >
                {t.navDashboard}
              </button>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleLanguage('en')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border ${
                    language === 'en'
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-slate-900 text-[#E2E8F0] border-slate-700'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleLanguage('ta')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border ${
                    language === 'ta'
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-slate-900 text-[#E2E8F0] border-slate-700'
                  }`}
                >
                  தமிழ்
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {isAnalyzing ? (
            <LoadingScreen message={uploadingLarge ? t.uploadingLargePdf : t.analyzingPdf} />
          ) : view === 'workspace' && activeDoc ? (
            <WorkspaceView
              doc={activeDoc}
              sessionId={sessionId}
              pdfBlobUrl={pdfBlobUrl}
              language={language}
              isRegenerating={isRegenerating}
              onLanguageChange={handleToggleLanguage}
              onModeChange={(nextMode) => {
                setSummaryMode(nextMode);
                handleRegenerateInWorkspace(nextMode, language);
              }}
              onUpdateDoc={upsertSavedDoc}
              onUploadNew={() => setView('home')}
            />
          ) : view === 'dashboard' ? (
            <DashboardView
              documents={savedDocs}
              language={language}
              onOpenDoc={(doc) => {
                if (activeDoc?.id !== doc.id) {
                  setSessionId(null);
                  setPdfBlobUrl(null);
                }
                setActiveDoc(doc);
                setLanguage(doc.language);
                setView('workspace');
              }}
              onDeleteDoc={(id) => {
                setSavedDocs((prev) => prev.filter((d) => d.id !== id));
                if (activeDoc?.id === id) {
                  setActiveDoc(null);
                  setSessionId(null);
                  setPdfBlobUrl(null);
                }
              }}
              onNewUpload={() => setView('home')}
            />
          ) : (
            <HomeSection
              language={language}
              onLanguageChange={setLanguage}
              summaryMode={summaryMode}
              onSummaryModeChange={setSummaryMode}
              onFileSelected={handleFileSelected}
              onLoadSamplePdf={handleLoadSamplePdf}
              errorMessage={errorMsg}
            />
          )}
        </main>

        {/* Deep Obsidian Footer */}
        <footer className="no-print bg-[#04070F]/95 text-[#F8FAFC] border-t border-slate-800/80">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <JoshLogo size="md" showTagline />
              <p className="mt-3 text-xs text-[#94A3B8]">{t.footerNote}</p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm text-[#94A3B8]">
              <button
                type="button"
                onClick={() => setView('home')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                {t.navHome}
              </button>
              {activeDoc && (
                <button
                  type="button"
                  onClick={() => setView('workspace')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.navWorkspace}
                </button>
              )}
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                {t.navDashboard}
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              © {new Date().getFullYear()} JOSH PDF. {t.productDescription}
            </p>
          </div>
        </footer>
      </div>
    </AppErrorBoundary>
  );
}
