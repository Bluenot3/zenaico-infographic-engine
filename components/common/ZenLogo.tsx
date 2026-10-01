import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface ZenLogoProps {
  className?: string;
  size?: number | string;
  engraved?: boolean;
  showWordmark?: boolean;
  subtitle?: string;
  glow?: boolean;
  useImageOnly?: boolean;
  customLogoUrl?: string;
}

export const ZenLogo: React.FC<ZenLogoProps> = ({
  className,
  size = 36,
  engraved = false,
  showWordmark = false,
  subtitle,
  glow = false,
  customLogoUrl,
}) => {
  const [logoSrc, setLogoSrc] = useState<string>('/zen-brand-logo.jpg');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const updateLogo = () => {
      try {
        const storedLogo = localStorage.getItem('zen_custom_brand_logo');
        if (customLogoUrl) {
          setLogoSrc(customLogoUrl);
          setImgError(false);
        } else if (storedLogo && storedLogo.trim()) {
          setLogoSrc(storedLogo);
          setImgError(false);
        } else {
          setLogoSrc('/zen-brand-logo.jpg');
          setImgError(false);
        }
      } catch {
        setLogoSrc('/zen-brand-logo.jpg');
      }
    };

    updateLogo();
    window.addEventListener('zen-logo-updated', updateLogo);
    return () => window.removeEventListener('zen-logo-updated', updateLogo);
  }, [customLogoUrl]);

  const numSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 36;

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <div 
        className={cn(
          "relative flex items-center justify-center rounded-2xl transition-all duration-300 overflow-hidden shrink-0 group/logo",
          engraved 
            ? "p-1.5 bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_20px_rgba(0,0,0,0.7)]" 
            : "p-1 bg-black border border-white/10 shadow-lg"
        )}
        style={{ width: numSize, height: numSize }}
      >
        {glow && (
          <div className="absolute inset-0 bg-blue-500/25 blur-md rounded-2xl pointer-events-none transition-opacity duration-300 group-hover/logo:opacity-100" />
        )}
        
        {/* Render Official Logo Asset */}
        {!imgError ? (
          <img 
            src={logoSrc} 
            alt="Official ZEN Brand Logo" 
            className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover/logo:scale-105 rounded-xl"
            referrerPolicy="no-referrer"
            style={{ imageRendering: 'auto' }}
            onError={() => {
              // Cascade through available official logo formats
              if (logoSrc === '/zen-brand-logo.jpg') {
                setLogoSrc('/zen-logo.svg');
              } else if (logoSrc === '/zen-logo.svg') {
                setLogoSrc('/Copy of ZEN Brand Logo (2).png');
              } else {
                setImgError(true);
              }
            }}
          />
        ) : (
          /* High-precision Vector Fallback */
          <svg 
            viewBox="0 0 1000 1000" 
            className="w-full h-full relative z-10 transition-transform duration-300 group-hover/logo:scale-105"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="1000" height="1000" fill="#000000" rx="160" />
            <g fill="#FFFFFF">
              {/* Top-Left Bracket and Upper Diagonal */}
              <path d="M 120 75
                       H 980
                       L 820 235
                       H 500
                       L 120 615
                       V 525
                       L 410 235
                       H 195
                       V 340
                       H 120
                       Z" />
                       
              {/* Center Parallel Diagonal Stripe */}
              <path d="M 288 748
                       L 748 288
                       L 824 364
                       L 364 824
                       Z" />
                       
              {/* Bottom-Right Bracket and Lower Diagonal */}
              <path d="M 880 925
                       H 20
                       L 180 765
                       H 500
                       L 880 385
                       V 475
                       L 590 765
                       H 805
                       V 660
                       H 880
                       Z" />
            </g>
          </svg>
        )}
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black tracking-tight text-white text-lg md:text-xl">
              ZEN <span className="text-blue-500">AI Co.</span>
            </span>
            {engraved && (
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-blue-300 font-bold border border-white/10">
                Official
              </span>
            )}
          </div>
          {subtitle && (
            <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
