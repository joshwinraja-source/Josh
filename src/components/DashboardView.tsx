import React, { useState } from 'react';
import {
  ArrowRight,
  Download,
  FileText,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations.ts';
import { AppLanguage, SavedDocument } from '../types.ts';
import { exportSummaryPdf } from '../utils/pdfExport.ts';

interface DashboardViewProps {
  documents: SavedDocument[];
  language: AppLanguage;
  onOpenDoc: (doc: SavedDocument) => void;
  onDeleteDoc: (id: string) => void;
  onNewUpload: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  language,
  onOpenDoc,
  onDeleteDoc,
  onNewUpload,
}) => {
  const t = TRANSLATIONS[language];
  const [query, setQuery] = useState('');

  const filtered = documents.filter(
    (d) =>
      (d.fileName || '').toLowerCase().includes(query.toLowerCase()) ||
      (d.summary?.title || '').toLowerCase().includes(query.toLowerCase())
  );

  const totalQuizzes = documents.filter((d) => d.lastQuizScore).length;
  const totalQa = documents.reduce((sum, d) => sum + (d.qaHistory?.length || 0), 0);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#60A5FA]">{t.brandName}</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
            {t.dashboardTitle}
          </h1>
          <p className="mt-1.5 text-sm text-[#94A3B8]">{t.dashboardSubtitle}</p>
        </div>

        <button
          type="button"
          onClick={onNewUpload}
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap shadow-md shadow-blue-600/25"
        >
          <Upload className="w-4 h-4" />
          <span>{t.newUpload}</span>
        </button>
      </div>

      {/* Dark Glassmorphic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs font-medium text-[#94A3B8]">{t.docsAnalyzed}</p>
          <p className="mt-2 font-mono-nums text-3xl font-bold text-[#F8FAFC]">
            {documents.length}
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs font-medium text-[#94A3B8]">{t.quizzesCompleted}</p>
          <p className="mt-2 font-mono-nums text-3xl font-bold text-[#F8FAFC]">
            {totalQuizzes}
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs font-medium text-[#94A3B8]">{t.questionsAnswered}</p>
          <p className="mt-2 font-mono-nums text-3xl font-bold text-[#F8FAFC]">
            {totalQa}
          </p>
        </div>
      </div>

      {/* Dark Glassmorphic Search & Document List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/60 flex items-center gap-3 bg-slate-900/50">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="flex-1 text-sm text-[#F8FAFC] placeholder:text-[#64748B] bg-transparent focus:outline-none"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-[#60A5FA] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
              {t.emptyDashboard}
            </p>
            <button
              type="button"
              onClick={onNewUpload}
              className="mt-5 px-5 py-2.5 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-sm font-semibold rounded-xl cursor-pointer"
            >
              {t.uploadPdfBtn}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs text-[#94A3B8]">
                    <span className="font-medium text-[#60A5FA]">
                      {doc.language === 'ta' ? 'தமிழ்' : 'English'}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>{doc.mode}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono-nums">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </span>
                    {doc.lastQuizScore && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono-nums text-[#F8FAFC] font-semibold">
                          Quiz {doc.lastQuizScore.score}/{doc.lastQuizScore.total}
                        </span>
                      </>
                    )}
                  </p>
                  <h2 className="mt-1 font-display text-base font-bold text-[#F8FAFC] truncate">
                    {doc.summary?.title || doc.fileName}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#94A3B8] truncate">{doc.fileName}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenDoc(doc)}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    <span>{t.openInWorkspace}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      exportSummaryPdf(doc.summary, doc.fileName, doc.language)
                    }
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-[#60A5FA] text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteDoc(doc.id)}
                    aria-label={t.deleteDoc}
                    className="min-h-[40px] px-2.5 py-2 text-red-400 hover:bg-red-500/15 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
