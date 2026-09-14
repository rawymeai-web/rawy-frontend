import React from 'react';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string;
  progress?: number; // Optional deterministic progress 0-100
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  className = '', 
  size = 'md',
  color,
  text,
  progress 
}) => {
  const sizeMap = {
    sm: {
      box: 'w-7 h-7',
      logo: 'w-6 h-6',
      text: 'text-[10px]'
    },
    md: {
      box: 'w-16 h-16',
      logo: 'w-14 h-14',
      text: 'text-xs'
    },
    lg: {
      box: 'w-24 h-24',
      logo: 'w-20 h-20',
      text: 'text-sm'
    },
    xl: {
      box: 'w-36 h-36',
      logo: 'w-28 h-28',
      text: 'text-base'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isDeterministic = typeof progress === 'number';
  const clampedProgress = isDeterministic ? Math.max(0, Math.min(100, progress)) : 0;

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <style>{`
        @keyframes rawyFillLoop {
          0% {
            clip-path: inset(100% 0 0 0);
            opacity: 0.15;
            filter: drop-shadow(0 0 0px transparent);
          }
          10% {
            opacity: 0.9;
          }
          50% {
            clip-path: inset(0% 0 0 0);
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(247, 143, 80, 0.4));
          }
          68% {
            clip-path: inset(0% 0 0 0);
            opacity: 1;
            filter: drop-shadow(0 0 16px rgba(247, 143, 80, 0.75));
            transform: scale(1.04);
          }
          82% {
            clip-path: inset(0% 0 0 0);
            opacity: 0.95;
            transform: scale(1);
          }
          94% {
            clip-path: inset(0% 0 0 0);
            opacity: 0.1;
            filter: drop-shadow(0 0 0px transparent);
          }
          100% {
            clip-path: inset(100% 0 0 0);
            opacity: 0;
            filter: drop-shadow(0 0 0px transparent);
          }
        }

        @keyframes rawyWaveLineLoop {
          0% {
            top: 100%;
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          50% {
            top: 0%;
            opacity: 1;
          }
          68% {
            top: 0%;
            opacity: 0;
          }
          100% {
            top: 0%;
            opacity: 0;
          }
        }

        @keyframes rawySkeletonPulse {
          0%, 100% {
            opacity: 0.22;
          }
          50% {
            opacity: 0.35;
          }
        }

        @keyframes rawyGlowPulse {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.55;
          }
        }
      `}</style>

      {/* Main Logo Container */}
      <div className={`relative flex items-center justify-center ${currentSize.box} select-none`}>
        
        {/* Ambient Soft Glow Behind Logo */}
        <div 
          className="absolute inset-[-10%] rounded-full bg-gradient-to-tr from-[#F78F50]/30 via-[#ECC156]/20 to-[#006B5D]/30 blur-md pointer-events-none"
          style={{ animation: 'rawyGlowPulse 2.4s ease-in-out infinite' }}
        ></div>

        {/* ------------------------------------------------------------- */}
        {/* 1. SKELETON LAYER: Abstract, uncolored monochrome logo base   */}
        {/* ------------------------------------------------------------- */}
        <img
          src="/logo-icon.png"
          alt="Rawy"
          className={`${currentSize.logo} object-contain select-none pointer-events-none`}
          style={{
            filter: 'grayscale(100%) brightness(1.25) contrast(0.7)',
            animation: 'rawySkeletonPulse 2.4s ease-in-out infinite'
          }}
        />

        {/* ------------------------------------------------------------- */}
        {/* 2. COLOR FILL LAYER: Authentic vibrant official colors        */}
        {/* Liquid fills up from bottom to top, revealing the logo       */}
        {/* ------------------------------------------------------------- */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={
            isDeterministic 
              ? { 
                  clipPath: `inset(${100 - clampedProgress}% 0 0 0)`,
                  transition: 'clip-path 0.3s ease-out'
                }
              : {
                  animation: 'rawyFillLoop 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                }
          }
        >
          <img
            src="/logo-icon.png"
            alt="Loading..."
            className={`${currentSize.logo} object-contain select-none pointer-events-none drop-shadow-md`}
          />

          {/* Luminous Liquid Wave / Meniscus at rising edge */}
          {!isDeterministic && size !== 'sm' && (
            <div 
              className="absolute left-1 right-1 h-[3px] bg-gradient-to-r from-transparent via-[#F78F50] to-transparent blur-[1px]"
              style={{
                animation: 'rawyWaveLineLoop 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }}
            ></div>
          )}
        </div>

        {/* Subtle rotating outer orbit ring for extra feedback */}
        <div 
          className="absolute inset-0 rounded-full border border-dashed border-[#F78F50]/20 pointer-events-none animate-[spin_8s_linear_infinite]"
        ></div>

      </div>

      {/* Optional Loading Caption */}
      {text && (
        <span className={`font-black text-[#001A40]/80 tracking-wide animate-pulse ${currentSize.text}`}>
          {text}
        </span>
      )}

      {/* Optional Progress Display */}
      {isDeterministic && (
        <span className="text-[11px] font-extrabold text-[#F78F50] tracking-wider">
          {Math.round(clampedProgress)}%
        </span>
      )}
    </div>
  );
};

export default Spinner;
