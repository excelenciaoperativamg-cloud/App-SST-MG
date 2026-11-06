import React from 'react';

interface MGLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'transparent';
  showSubtitle?: boolean;
}

export const MGLogo: React.FC<MGLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark',
  showSubtitle = true,
}) => {
  // Height presets for the official logo
  const heights = {
    sm: 'h-8 max-w-[90px]',
    md: 'h-10 max-w-[120px]',
    lg: 'h-14 max-w-[160px]',
    xl: 'h-20 max-w-[220px]',
  };

  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official MG Consultores S.A.S. Logo Image */}
      <div
        className={`relative flex items-center justify-center rounded-xl transition-all ${
          isDark
            ? 'bg-white px-2.5 py-1 shadow-sm border border-slate-200/80'
            : variant === 'light'
            ? 'bg-transparent'
            : ''
        }`}
      >
        <img
          src="/assets/aistudio/logo_639f00ab.png"
          alt="MG Consultores S.A.S. - Logo Oficial"
          className={`${heights[size]} w-auto object-contain`}
          loading="eager"
        />
      </div>

      {showSubtitle && (
        <div className="flex flex-col leading-tight">
          <span
            className={`text-[11px] font-black tracking-wider uppercase ${
              isDark ? 'text-white' : 'text-[#0A2958]'
            }`}
          >
            SISTEMA SG-SST
          </span>
          <span
            className={`text-[9px] font-medium tracking-tight ${
              isDark ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Seguridad y Salud en el Trabajo
          </span>
        </div>
      )}
    </div>
  );
};
