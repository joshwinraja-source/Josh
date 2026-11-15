import React from 'react';
import joshLogoImg from '../assets/images/josh_pdf_logo_1794762063256.jpg';

interface JoshLogoProps {
  inverted?: boolean;
  darkText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const JoshLogo: React.FC<JoshLogoProps> = ({
  inverted = false,
  darkText = false,
  size = 'md',
  showTagline = false,
}) => {
  const boxSize =
    size === 'lg'
      ? 'w-16 h-16 rounded-2xl'
      : size === 'sm'
      ? 'w-9 h-9 rounded-lg'
      : 'w-11 h-11 rounded-xl';
  const textSize =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg sm:text-xl';

  const useDarkInk = darkText && !inverted;

  return (
    <div className="inline-flex items-center gap-3 shrink-0 select-none">
      {/* Generated JOSH PDF Brand Logo Mark */}
      <div
        className={`${boxSize} overflow-hidden shrink-0 border border-blue-500/35 bg-[#0B1120] shadow-md shadow-blue-600/25`}
      >
        <img
          src={joshLogoImg}
          alt="JOSH PDF logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <span
          className={`font-display font-extrabold tracking-tight block whitespace-nowrap leading-tight ${textSize} ${
            useDarkInk ? 'text-[#172554]' : 'text-[#F8FAFC]'
          }`}
        >
          JOSH{' '}
          <span className={useDarkInk ? 'text-[#2563EB]' : 'text-[#60A5FA]'}>
            PDF
          </span>
        </span>
        {showTagline && (
          <span
            className={`block text-[11px] font-medium mt-1 whitespace-nowrap ${
              useDarkInk ? 'text-[#64748B]' : 'text-[#94A3B8]'
            }`}
          >
            Upload. Understand. Learn Faster.
          </span>
        )}
      </div>
    </div>
  );
};
