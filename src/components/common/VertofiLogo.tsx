import React from 'react';

interface VertofiLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'full' | 'mark' | 'horizontal' | 'badge';
  showTagline?: boolean;
}

export const VertofiLogo: React.FC<VertofiLogoProps> = ({
  className = '',
  size = 48,
  variant = 'mark',
  showTagline = false
}) => {
  // Pure vector geometry matching official Vertofi brand identity
  const Emblem = ({ width = size, height = size }: { width?: number | string; height?: number | string }) => (
    <svg
      viewBox="0 0 160 160"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* 1. Left Speed / Data Elements (Black) */}
      {/* Row 1 */}
      <circle cx="58" cy="38" r="4.5" fill="#111827" />
      <circle cx="76" cy="38" r="4.5" fill="#111827" />

      {/* Row 2 */}
      <circle cx="44" cy="56" r="4.5" fill="#111827" />
      <rect x="56" y="51.5" width="34" height="9" rx="4.5" fill="#111827" />

      {/* Row 3 */}
      <circle cx="56" cy="74" r="4.5" fill="#111827" />
      <rect x="68" y="69.5" width="34" height="9" rx="4.5" fill="#111827" />

      {/* Row 4 */}
      <circle cx="64" cy="92" r="4.5" fill="#111827" />
      <rect x="76" y="87.5" width="34" height="9" rx="4.5" fill="#111827" />

      {/* 2. Top-Center Blue Polygon Facet */}
      <path
        d="M98 22 L122 46 L108 58 L98 48 Z"
        fill="#0066FF"
      />
      <path
        d="M98 22 L98 76 L108 66 L108 42 Z"
        fill="#0066FF"
      />

      {/* 3. Right Golden/Yellow Pillar */}
      <path
        d="M128 32 L152 48 L152 118 L138 106 L138 52 L128 44 Z"
        fill="#D99B16"
      />

      {/* 4. Bottom-Right Red Accent Wedge */}
      <path
        d="M128 114 L152 132 L128 132 Z"
        fill="#E52320"
      />
    </svg>
  );

  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <Emblem />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center justify-center p-2 rounded-2xl bg-white border border-slate-200/90 shadow-xs ${className}`}>
        <Emblem width={size} height={size} />
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <Emblem width={36} height={36} />
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 tracking-[0.18em] text-base leading-none font-sans uppercase">
            VERTOFI
          </span>
          {showTagline && (
            <span className="text-[8px] font-bold tracking-wider text-slate-400 mt-1 uppercase">
              <span className="text-slate-700">Transform</span> • <span className="text-blue-600">Account</span> • <span className="text-amber-500">Intelligence</span> • <span className="text-rose-600">Growth</span>
            </span>
          )}
        </div>
      </div>
    );
  }

  // 'full' stacked version
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <Emblem width={size} height={size} />
      <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-[0.22em] font-sans uppercase">
        VERTOFI
      </h1>
      {showTagline && (
        <div className="mt-1 text-[9px] sm:text-[10px] font-bold tracking-[0.14em] uppercase flex items-center justify-center gap-1.5 flex-wrap">
          <span className="text-slate-800">TRANSFORM</span>
          <span className="text-slate-300">•</span>
          <span className="text-[#0066FF]">ACCOUNT</span>
          <span className="text-slate-300">•</span>
          <span className="text-[#D99B16]">INTELLIGENCE</span>
          <span className="text-slate-300">•</span>
          <span className="text-[#E52320]">GROWTH</span>
        </div>
      )}
    </div>
  );
};
