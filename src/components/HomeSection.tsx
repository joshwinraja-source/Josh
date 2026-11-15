import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  FileText,
  FileUp,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations.ts';
import { AppLanguage, SummaryMode } from '../types.ts';

interface HomeSectionProps {
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  summaryMode: SummaryMode;
  onSummaryModeChange: (mode: SummaryMode) => void;
  onFileSelected: (file: File) => void;
  onLoadSamplePdf: () => void;
  errorMessage: string | null;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  language,
  onLanguageChange,
  summaryMode,
  onSummaryModeChange,
  onFileSelected,
  onLoadSamplePdf,
  errorMessage,
}) => {
  const t = TRANSLATIONS[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div>
      {/* Dark Glassmorphic Hero + Upload Dropzone */}
      <section className="py-10 sm:py-16 lg:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6">
              <p className="text-sm font-semibold text-[#60A5FA]">
                {t.brandName} <span aria-hidden="true">·</span> {t.productDescription}
              </p>
              <h1 className="mt-2.5 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight leading-[1.2] [text-wrap:balance]">
                {t.heroHeadline}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-xl">
                {t.heroSubtitle}
              </p>

              {/* Student Study Mode & Language Selectors */}
              <div className="mt-7 space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-[#CBD5E1] mb-2">
                    {t.summaryStyleLabel}
                  </span>
                  <div className="glass-subtle inline-flex flex-wrap items-center gap-1 p-1 rounded-2xl">
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
                        onClick={() => onSummaryModeChange(m.id)}
                        className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                          summaryMode === m.id
                            ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/30'
                            : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#CBD5E1] mb-2">
                    {t.outputLanguageLabel}
                  </span>
                  <div className="glass-subtle inline-flex items-center gap-1 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => onLanguageChange('en')}
                      className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                        language === 'en'
                          ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/30'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange('ta')}
                      className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                        language === 'ta'
                          ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/30'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      தமிழ் (Tamil)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Dark Glassmorphic PDF Dropzone */}
            <div className="lg:col-span-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`glass-panel rounded-3xl p-7 sm:p-10 text-center transition-colors ${
                  isDragging
                    ? 'ring-2 ring-[#3B82F6] bg-slate-900/90'
                    : 'hover:border-blue-500/40'
                }`}
              >
                <div className="w-15 h-15 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/30">
                  <FileUp className="w-7 h-7" aria-hidden="true" />
                </div>

                <h2 className="mt-5 font-display text-lg sm:text-xl font-bold text-[#F8FAFC]">
                  {t.dropzoneTitle}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#94A3B8]">
                  {t.dropzoneHint}
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileSelected(file);
                    e.target.value = '';
                  }}
                />

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-blue-600/30 cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t.chooseFileBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onLoadSamplePdf}
                    className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-800/80 hover:bg-slate-800 text-[#F8FAFC] border border-slate-700/80 text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>{t.trySampleBtn}</span>
                    <ArrowRight className="w-4 h-4 text-[#60A5FA]" />
                  </button>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="mt-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/35 text-xs sm:text-sm text-red-200 text-left"
                  >
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Glassmorphic Student Features */}
      <section className="pb-16 pt-4">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <p className="text-sm font-semibold text-[#60A5FA]">{t.brandName}</p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
              {t.howItWorksTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-[#2563EB]/20 border border-blue-500/30 text-[#60A5FA] flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-base font-bold text-[#F8FAFC]">
                {t.feat1Title}
              </h3>
              <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                {t.feat1Desc}
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-[#2563EB]/20 border border-blue-500/30 text-[#60A5FA] flex items-center justify-center mb-4">
                <HelpCircle className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-base font-bold text-[#F8FAFC]">
                {t.feat2Title}
              </h3>
              <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                {t.feat2Desc}
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-[#2563EB]/20 border border-blue-500/30 text-[#60A5FA] flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-base font-bold text-[#F8FAFC]">
                {t.feat3Title}
              </h3>
              <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                {t.feat3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
