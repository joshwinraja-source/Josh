import React from 'react';
import { JoshLogo } from './JoshLogo.tsx';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Upload. Understand. Learn Faster.',
}) => {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="glass-panel rounded-3xl px-8 py-10 max-w-md w-full flex flex-col items-center">
        <JoshLogo size="lg" />
        <div className="mt-6 w-52 h-2 bg-slate-900/90 border border-slate-700/60 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-[#3B82F6] rounded-full animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-medium text-[#E2E8F0]">{message}</p>
      </div>
    </div>
  );
};
