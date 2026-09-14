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
      box: 'w-8 h-8',
      logo: 'w-7 h-7',
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
        @keyframes rawyLiquidFillLoop {
          0% {
            clip-path: inset(100% 0 0 0);
            opacity: 0.2;
            filter: drop-shadow(0 0 0px transparent);
          }
          12% {
            opacity: 0.9;
          }
          52% {
            clip-path: inset(0% 0 0 0);
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(247, 143, 80, 0.45));
          }
          70% {
            clip-path: inset(0% 0 0 0);
            opacity: 1;
            filter: drop-shadow(0 0 16px rgba(247, 143, 80, 0.8));
            transform: scale(1.03);
          }
          84% {
            clip-path: inset(0% 0 0 0);
            opacity: 0.95;
            transform: scale(1);
          }
          95% {
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

        @keyframes rawyLiquidWave {
          0% {
            top: 100%;
            opacity: 0;
          }
          12% {
            opacity: 0.9;
          }
          52% {
            top: 0%;
            opacity: 1;
          }
          70% {
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
            opacity: 0.35;
          }
          50% {
            opacity: 0.55;
          }
        }

        @keyframes rawyGlowPulse {
          0%, 100% {
            transform: scale(0.95);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.45;
          }
        }
      `}</style>

      {/* Main Logo Container */}
      <div className={`relative flex items-center justify-center ${currentSize.box} select-none`}>
        
        {/* Soft Ambient Radial Glow Behind Logo */}
        <div 
          className="absolute inset-[-12%] rounded-full bg-gradient-to-tr from-[#F78F50]/25 via-[#ECC156]/20 to-[#006B5D]/25 blur-md pointer-events-none"
          style={{ animation: 'rawyGlowPulse 2.4s ease-in-out infinite' }}
        ></div>

        {/* ------------------------------------------------------------- */}
        {/* 1. SKELETON LAYER: The exact line-art outline (empty logo)    */}
        {/* ------------------------------------------------------------- */}
        <img
          src="/logo-skeleton.png"
          alt="Rawy Outline Skeleton"
          className={`${currentSize.logo} object-contain select-none pointer-events-none z-10`}
          style={{
            animation: 'rawySkeletonPulse 2.4s ease-in-out infinite'
          }}
        />

        {/* ------------------------------------------------------------- */}
        {/* 2. COLOR FILL LAYER: Authentic vibrant official colors        */}
        {/* Fills up inside the skeleton from bottom (0%) to top (100%)   */}
        {/* ------------------------------------------------------------- */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          style={
            isDeterministic 
              ? { 
                  clipPath: `inset(${100 - clampedProgress}% 0 0 0)`,
                  transition: 'clip-path 0.3s ease-out'
                }
              : {
                  animation: 'rawyLiquidFillLoop 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                }
          }
        >
          <img
            src="/logo-color.png"
            alt="Loading Color Logo"
            className={`${currentSize.logo} object-contain select-none pointer-events-none drop-shadow-md`}
          />

          {/* Luminous rising liquid meniscus wave */}
          {!isDeterministic && size !== 'sm' && (
            <div 
              className="absolute left-2 right-2 h-[3px] bg-gradient-to-r from-transparent via-[#F78F50] to-transparent blur-[1px]"
              style={{
                animation: 'rawyLiquidWave 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }}
            ></div>
          )}
        </div>

        {/* Subtle rotating orbit ring */}
        <div 
          className="absolute inset-0 rounded-full border border-dashed border-[#F78F50]/25 pointer-events-none animate-[spin_10s_linear_infinite]"
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
