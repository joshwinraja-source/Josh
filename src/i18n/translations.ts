import { AppLanguage } from '../types.ts';

export const TRANSLATIONS: Record<
  AppLanguage,
  {
    brandName: string;
    tagline: string;
    productDescription: string;
    navHome: string;
    navWorkspace: string;
    navDashboard: string;
    uploadPdfBtn: string;
    heroHeadline: string;
    heroSubtitle: string;
    dropzoneTitle: string;
    dropzoneHint: string;
    chooseFileBtn: string;
    trySampleBtn: string;
    summaryStyleLabel: string;
    modeConcise: string;
    modeDetailed: string;
    modeBullets: string;
    outputLanguageLabel: string;
    howItWorksTitle: string;
    feat1Title: string;
    feat1Desc: string;
    feat2Title: string;
    feat2Desc: string;
    feat3Title: string;
    feat3Desc: string;
    loadingTitle: string;
    loadingSubtitle: string;
    analyzingPdf: string;
    uploadingLargePdf: string;
    tabSummary: string;
    tabQa: string;
    tabQuiz: string;
    tabPreview: string;
    regenerateSummary: string;
    copySummary: string;
    copied: string;
    exportMenu: string;
    exportSummaryPdf: string;
    exportQuizPdf: string;
    exportQaPdf: string;
    exportMarkdown: string;
    printPdf: string;
    tldrLabel: string;
    executiveSummary: string;
    keyPoints: string;
    coreConcepts: string;
    flashcardMode: string;
    listMode: string;
    flipHint: string;
    formulasAndFacts: string;
    studyTakeaways: string;
    suggestedQuestions: string;
    qaQuickExplain: string;
    qaQuickExam: string;
    qaQuickFacts: string;
    qaPlaceholder: string;
    askBtn: string;
    qaEmptyHint: string;
    quizConfigTitle: string;
    questionCount: string;
    difficulty: string;
    diffEasy: string;
    diffMedium: string;
    diffHard: string;
    generateQuizBtn: string;
    generatingQuiz: string;
    checkAnswersBtn: string;
    retakeQuizBtn: string;
    scoreLabel: string;
    dashboardTitle: string;
    dashboardSubtitle: string;
    docsAnalyzed: string;
    quizzesCompleted: string;
    questionsAnswered: string;
    searchPlaceholder: string;
    emptyDashboard: string;
    openInWorkspace: string;
    deleteDoc: string;
    newUpload: string;
    footerNote: string;
    pdfViewerFallback: string;
  }
> = {
  en: {
    brandName: 'JOSH PDF',
    tagline: 'Upload. Understand. Learn Faster.',
    productDescription: 'Free AI-Powered PDF Summarizer.',
    navHome: 'Home',
    navWorkspace: 'Study Space',
    navDashboard: 'My Notes',
    uploadPdfBtn: 'Upload PDF',
    heroHeadline: 'Upload. Understand. Learn Faster.',
    heroSubtitle:
      'Free AI-Powered PDF Summarizer built for students. Upload textbooks, lecture slides, or research papers up to 50 MB for clear study notes, flashcards, streaming Q&A, and practice quizzes.',
    dropzoneTitle: 'Drop your PDF textbook or notes here',
    dropzoneHint: 'Supports large PDFs up to 50 MB · Fast English & Tamil AI',
    chooseFileBtn: 'Select PDF File',
    trySampleBtn: 'Try Sample Study PDF',
    summaryStyleLabel: 'Study Mode',
    modeConcise: 'Quick TL;DR',
    modeDetailed: 'Exam Notes',
    modeBullets: 'Revision Bullets',
    outputLanguageLabel: 'Study Language',
    howItWorksTitle: 'Built to help students study smarter',
    feat1Title: '01. Exam-Ready AI Notes & Flashcards',
    feat1Desc:
      'Extracts plain-language explanations, key formulas, definitions, and interactive flip flashcards from dense chapters.',
    feat2Title: '02. Instant Streaming Q&A',
    feat2Desc:
      'Ask doubts in real time and get fast, grounded answers straight from your uploaded PDF with 1-tap study prompts.',
    feat3Title: '03. Quizzes & Branded PDF Exports',
    feat3Desc:
      'Test yourself with auto-generated MCQs and download clean JOSH PDF study sheets in English or Tamil.',
    loadingTitle: 'JOSH PDF',
    loadingSubtitle: 'Upload. Understand. Learn Faster.',
    analyzingPdf: 'Reading your PDF and crafting structured study notes...',
    uploadingLargePdf: 'Uploading large PDF securely for deep AI analysis...',
    tabSummary: 'Study Notes',
    tabQa: 'Ask AI',
    tabQuiz: 'Practice Quiz',
    tabPreview: 'PDF View',
    regenerateSummary: 'Refresh',
    copySummary: 'Copy Notes',
    copied: 'Copied',
    exportMenu: 'Download',
    exportSummaryPdf: 'Download Summary PDF',
    exportQuizPdf: 'Download Quiz PDF',
    exportQaPdf: 'Download Q&A PDF',
    exportMarkdown: 'Download Markdown (.md)',
    printPdf: 'Print / Save Vector PDF',
    tldrLabel: 'In One Sentence',
    executiveSummary: 'Chapter Overview',
    keyPoints: 'Key Study Points',
    coreConcepts: 'Key Terms & Flashcards',
    flashcardMode: 'Flashcards',
    listMode: 'List View',
    flipHint: 'Tap card to reveal explanation',
    formulasAndFacts: 'Important Facts, Dates & Formulas',
    studyTakeaways: 'Exam & Revision Takeaways',
    suggestedQuestions: 'Suggested Study Questions',
    qaQuickExplain: 'Explain simply',
    qaQuickExam: '5-mark exam answer',
    qaQuickFacts: 'Key facts to memorize',
    qaPlaceholder: 'Ask any doubt about this PDF...',
    askBtn: 'Ask',
    qaEmptyHint:
      'Type any question about this chapter or tap a quick student prompt below.',
    quizConfigTitle: 'Create Practice Quiz',
    questionCount: 'Questions',
    difficulty: 'Difficulty',
    diffEasy: 'Easy',
    diffMedium: 'Medium',
    diffHard: 'Challenging',
    generateQuizBtn: 'Generate Quiz',
    generatingQuiz: 'Creating Questions...',
    checkAnswersBtn: 'Check Answers',
    retakeQuizBtn: 'Retake Quiz',
    scoreLabel: 'Your Score',
    dashboardTitle: 'My Saved Study Notes',
    dashboardSubtitle:
      'Revisit your summarized PDFs, Q&A transcripts, quizzes, and download study exports anytime.',
    docsAnalyzed: 'PDFs Studied',
    quizzesCompleted: 'Quizzes Taken',
    questionsAnswered: 'Questions Asked',
    searchPlaceholder: 'Search your saved notes...',
    emptyDashboard:
      'No saved study notes yet. Upload a PDF or try our sample study PDF to start.',
    openInWorkspace: 'Open Notes',
    deleteDoc: 'Delete',
    newUpload: 'New PDF',
    footerNote: 'Free AI-Powered PDF Summarizer · Student Study Workspace in English & Tamil',
    pdfViewerFallback:
      'If inline PDF preview is unavailable on this device, all AI Notes, Ask AI, Quiz, and Export tools remain active.',
  },
  ta: {
    brandName: 'JOSH PDF',
    tagline: 'பதிவேற்று. புரிந்துகொள். விரைவில் கற்றுக்கொள்.',
    productDescription: 'இலவச AI PDF சுருக்கக் கருவி.',
    navHome: 'முகப்பு',
    navWorkspace: 'கற்றல் இடம்',
    navDashboard: 'என் குறிப்புகள்',
    uploadPdfBtn: 'PDF பதிவேற்றம்',
    heroHeadline: 'பதிவேற்று. புரிந்துகொள். விரைவில் கற்றுக்கொள்.',
    heroSubtitle:
      'மாணவர்களுக்கான இலவச AI PDF சுருக்கக் கருவி. 50 MB வரையிலான பாடப் புத்தகங்கள் மற்றும் குறிப்புகளைத் தெளிவான சுருக்கம், ஃப்ளாஷ்கார்டுகள், நேரடி கேள்வி-பதில் மற்றும் வினாடி வினாவாக மாற்றுங்கள்.',
    dropzoneTitle: 'உங்கள் PDF பாடக் குறிப்பை இங்கே விடவும்',
    dropzoneHint: '50 MB வரையிலான பெரிய PDF கோப்புகள் · தமிழ் & ஆங்கில ஆதரவு',
    chooseFileBtn: 'PDF கோப்பைத் தேர்வு செய்',
    trySampleBtn: 'மாதிரி PDF-ஐ முயற்சி செய்',
    summaryStyleLabel: 'கற்றல் முறை',
    modeConcise: 'விரைவு சுருக்கம்',
    modeDetailed: 'தேர்வுக் குறிப்பு',
    modeBullets: 'முக்கிய புள்ளிகள்',
    outputLanguageLabel: 'கற்றல் மொழி',
    howItWorksTitle: 'மாணவர்கள் விரைவாகக் கற்க உதவும் கருவிகள்',
    feat1Title: '01. தேர்வுக் குறிப்புகள் & ஃப்ளாஷ்கார்டுகள்',
    feat1Desc:
      'பாடங்களில் உள்ள முக்கிய வரையறைகள், சூத்திரங்கள் மற்றும் கருத்துகளை எளிமையாகப் பிரித்தெடுக்கிறது.',
    feat2Title: '02. விரைவான நேரடி கேள்வி-பதில்',
    feat2Desc:
      'உங்கள் சந்தேகங்களைக் கேட்டு PDF அடிப்படையிலான தெளிவான பதில்களை உடனடியாகப் பெறுங்கள்.',
    feat3Title: '03. வினாடி வினா & PDF ஏற்றுமதி',
    feat3Desc:
      'பயிற்சி வினாடி வினாக்களை உருவாக்கி JOSH PDF கோப்பாகப் பதிவிறக்கவும்.',
    loadingTitle: 'JOSH PDF',
    loadingSubtitle: 'பதிவேற்று. புரிந்துகொள். விரைவில் கற்றுக்கொள்.',
    analyzingPdf: 'உங்கள் PDF படிக்கப்பட்டு கற்றல் குறிப்புகள் உருவாகின்றன...',
    uploadingLargePdf: 'பெரிய PDF பாதுகாப்பாகப் பதிவேற்றப்படுகிறது...',
    tabSummary: 'கற்றல் குறிப்பு',
    tabQa: 'AI-யிடம் கேள்',
    tabQuiz: 'வினாடி வினா',
    tabPreview: 'PDF பார்வை',
    regenerateSummary: 'புதுப்பி',
    copySummary: 'நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது',
    exportMenu: 'பதிவிறக்கம்',
    exportSummaryPdf: 'சுருக்க PDF பதிவிறக்கு',
    exportQuizPdf: 'வினாடி வினா PDF பதிவிறக்கு',
    exportQaPdf: 'கேள்வி-பதில் PDF பதிவிறக்கு',
    exportMarkdown: 'Markdown (.md) பதிவிறக்கு',
    printPdf: 'அச்சிடு / PDF சேமி',
    tldrLabel: 'ஒரே வரியில்',
    executiveSummary: 'பாடச் சுருக்கம்',
    keyPoints: 'முக்கிய கற்றல் புள்ளிகள்',
    coreConcepts: 'முக்கிய சொற்கள் & ஃப்ளாஷ்கார்டுகள்',
    flashcardMode: 'ஃப்ளாஷ்கார்டு',
    listMode: 'பட்டியல்',
    flipHint: 'விளக்கத்தைப் பார்க்க தட்டவும்',
    formulasAndFacts: 'முக்கிய தகவல்கள் & சூத்திரங்கள்',
    studyTakeaways: 'தேர்வுக்கான முக்கிய குறிப்புகள்',
    suggestedQuestions: 'பரிந்துரைக்கப்பட்ட கேள்விகள்',
    qaQuickExplain: 'எளிமையாக விளக்கு',
    qaQuickExam: '5-மதிப்பெண் தேர்வு பதில்',
    qaQuickFacts: 'நினைவில் கொள்ள வேண்டியவை',
    qaPlaceholder: 'இந்த PDF பற்றி உங்கள் சந்தேகத்தைக் கேளுங்கள்...',
    askBtn: 'கேள்',
    qaEmptyHint:
      'இந்தப் பாடம் குறித்து எந்தக் கேள்வியையும் கேளுங்கள் அல்லது கீழுள்ள விரைவுப் பொத்தானைத் தட்டவும்.',
    quizConfigTitle: 'பயிற்சி வினாடி வினா உருவாக்கு',
    questionCount: 'கேள்விகள்',
    difficulty: 'கடினத்தன்மை',
    diffEasy: 'எளிமை',
    diffMedium: 'நடுத்தரம்',
    diffHard: 'கடினம்',
    generateQuizBtn: 'வினாடி வினா உருவாக்கு',
    generatingQuiz: 'கேள்விகள் உருவாகின்றன...',
    checkAnswersBtn: 'பதில்களைச் சரிபார்',
    retakeQuizBtn: 'மீண்டும் முயற்சி செய்',
    scoreLabel: 'மதிப்பெண்',
    dashboardTitle: 'என் சேமித்த கற்றல் குறிப்புகள்',
    dashboardSubtitle:
      'நீங்கள் சுருக்கிய PDF-கள், கேள்வி-பதில்கள் மற்றும் வினாடி வினாக்களை எப்போது வேண்டுமானாலும் பார்க்கலாம்.',
    docsAnalyzed: 'படித்த PDF-கள்',
    quizzesCompleted: 'முடித்த வினாடி வினாக்கள்',
    questionsAnswered: 'கேட்ட கேள்விகள்',
    searchPlaceholder: 'குறிப்புகளைத் தேடு...',
    emptyDashboard:
      'இதுவரை சேமிக்கப்பட்ட குறிப்புகள் இல்லை. தொடங்க ஒரு PDF-ஐப் பதிவேற்றவும்.',
    openInWorkspace: 'குறிப்பைத் திற',
    deleteDoc: 'நீக்கு',
    newUpload: 'புதிய PDF',
    footerNote: 'இலவச AI PDF சுருக்கக் கருவி · மாணவர்களுக்கான தமிழ் மற்றும் ஆங்கில கற்றல் தளம்',
    pdfViewerFallback:
      'உங்கள் சாதனத்தில் நேரடி PDF பார்வை தோன்றாவிட்டாலும் AI குறிப்புகள், கேள்வி-பதில் மற்றும் ஏற்றுமதி முழுமையாக இயங்கும்.',
  },
};
