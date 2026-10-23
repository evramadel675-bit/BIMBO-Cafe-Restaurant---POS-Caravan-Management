import React, { useState } from 'react';
import { BIMBO_LOGO_BASE64 } from '../utils/logoBase64';

interface BimboLogoProps {
  className?: string;
  alt?: string;
}

/**
 * Self-contained circular logo badge for BIMBO Cafe & Restaurant.
 * Renders embedded Base64 image with automatic fallback to pure inline SVG.
 * 100% offline and fully compatible with file:/// protocol, localhost, and PWA.
 */
export const BimboLogo: React.FC<BimboLogoProps> = ({ 
  className = "w-12 h-12 rounded-full", 
  alt = "BIMBO Cafe & Restaurant" 
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // Pure vector SVG fallback: circular badge with BIMBO, coffee cup, fork, and wheat/stars
    return (
      <svg 
        viewBox="0 0 500 500" 
        className={`${className} aspect-square shrink-0 select-none`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="250" cy="250" r="240" fill="#141211" stroke="#d97706" strokeWidth="10" />
        <circle cx="250" cy="250" r="224" fill="none" stroke="#f59e0b" strokeWidth="3" />
        
        {/* Top curved text: BIMBO */}
        <path id="svg-top-arc-logo" d="M 70 250 A 180 180 0 0 1 430 250" fill="none" />
        <text fill="#ffffff" fontSize="56" fontWeight="900" letterSpacing="3px">
          <textPath href="#svg-top-arc-logo" startOffset="50%" textAnchor="middle">
            BIMBO
          </textPath>
        </text>

        {/* Center circular emblem */}
        <circle cx="250" cy="265" r="120" fill="#d97706" stroke="#f59e0b" strokeWidth="4" />

        {/* Steam swirls */}
        <path d="M 230 180 Q 235 160 230 145" fill="none" stroke="#fef3c7" strokeWidth="5" strokeLinecap="round" />
        <path d="M 250 175 Q 255 155 250 140" fill="none" stroke="#fef3c7" strokeWidth="5" strokeLinecap="round" />
        <path d="M 270 180 Q 275 160 270 145" fill="none" stroke="#fef3c7" strokeWidth="5" strokeLinecap="round" />

        {/* Coffee Cup */}
        <path d="M 190 220 Q 190 310 250 310 Q 310 310 310 220 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="4" />
        <path d="M 310 235 Q 345 235 345 265 Q 345 295 305 295" fill="none" stroke="#fef3c7" strokeWidth="12" strokeLinecap="round" />
        <ellipse cx="250" cy="225" rx="55" ry="14" fill="#78350f" />

        {/* Integrated Fork */}
        <path d="M 235 240 L 255 290" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
        <path d="M 240 235 L 246 250" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
        <path d="M 246 238 L 252 253" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />

        {/* Bottom curved text: CAFE & RESTAURANT */}
        <path id="svg-bottom-arc-logo" d="M 80 300 A 180 180 0 0 0 420 300" fill="none" />
        <text fill="#fde68a" fontSize="24" fontWeight="800" letterSpacing="2px">
          <textPath href="#svg-bottom-arc-logo" startOffset="50%" textAnchor="middle">
            CAFE &amp; RESTAURANT
          </textPath>
        </text>

        {/* Est. 2026 */}
        <text x="250" y="445" textAnchor="middle" fill="#d97706" fontSize="18" fontWeight="700">
          Est. 2026
        </text>
      </svg>
    );
  }

  return (
    <img 
      src={BIMBO_LOGO_BASE64} 
      alt={alt}
      onError={() => setHasError(true)}
      className={`${className} object-cover aspect-square shrink-0 select-none`}
    />
  );
};
