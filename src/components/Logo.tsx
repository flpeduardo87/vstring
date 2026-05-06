import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  textColor?: string;
  iconColor?: string;
}

export function Logo({ 
  className = "h-12 w-12", 
  showText = true, 
  textColor = "text-white",
  iconColor = "text-primary"
}: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${className} flex items-center justify-center relative`}>
        {/* Technical SVG Logo inspired by VSTRING branding */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(217,255,0,0.3)]">
          {/* Outer circle */}
          <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
          
          {/* Racket Strings Detail */}
          <g className="text-white/20" stroke="currentColor" strokeWidth="0.8">
            <line x1="30" y1="35" x2="50" y2="35" />
            <line x1="30" y1="42" x2="52" y2="42" />
            <line x1="30" y1="49" x2="54" y2="49" />
            <line x1="30" y1="56" x2="56" y2="56" />
            
            <line x1="35" y1="30" x2="35" y2="60" />
            <line x1="42" y1="30" x2="42" y2="60" />
            <line x1="49" y1="30" x2="49" y2="60" />
          </g>

          {/* Racket Frame Accent around V */}
          <path 
            d="M58 72Q15 75 25 35Q30 18 55 22" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            className="text-primary"
          />

          {/* The "V" */}
          <path 
            d="M45 42L58 72L78 30" 
            fill="none" 
            stroke="white" 
            strokeWidth="10" 
            strokeLinecap="square" 
            strokeLinejoin="miter"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-1">
            <span className={`font-black tracking-tighter text-3xl italic ${textColor}`}>
              V<span className="text-primary">STRING</span>
            </span>
          </div>
          <span className={`font-black tracking-[0.25em] text-[9px] uppercase text-primary mt-1`}>
            Elite Performance
          </span>
        </div>
      )}
    </div>
  );
}
