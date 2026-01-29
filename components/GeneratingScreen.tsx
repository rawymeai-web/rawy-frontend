
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Language, StoryData } from '../types';

interface GeneratingScreenProps {
  status: string;
  language: Language;
  progress: number;
  storyData?: StoryData;
  error?: string | null;
}

interface Collectible {
  id: number;
  x: number;
  y: number;
  lane: 'top' | 'bottom';
  type: 'quill' | 'gate' | 'flask';
  value?: string;
  color?: string;
  collected: boolean;
}

const GeneratingScreen: React.FC<GeneratingScreenProps> = ({ status, language, progress, storyData, error }) => {
  const [cpuY, setCpuY] = useState(25);
  const [playerY, setPlayerY] = useState(75);
  const [playerVelocity, setPlayerVelocity] = useState(0);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [isFlapping, setIsFlapping] = useState(false);
  const [targetColor, setTargetColor] = useState('orange');

  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  // 3-Round System based on progress
  const round = progress < 33 ? 1 : progress < 66 ? 2 : 3;
  const roundNames = [
    t('المسودة: جمع ريش الكتابة', 'Round 1: Quill Collecting'),
    t('التخطيط: بوابات الحبكة', 'Round 2: Plot Upgrade Gates'),
    t('التلوين: فرز قوارير الحبر', 'Round 3: Ink Flask Sorting')
  ];

  const colors = ['orange', 'teal', 'navy', 'yellow'];

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = (time - lastTimeRef.current) / 1000;

      // Player Physics (Hard Lanes)
      setPlayerY(prevY => {
        const gravity = 150;
        const newVel = playerVelocity + (gravity * deltaTime);
        setPlayerVelocity(newVel);
        let nextY = prevY + (newVel * deltaTime * 0.1);
        if (nextY > 92) { nextY = 92; setPlayerVelocity(0); }
        if (nextY < 58) { nextY = 58; setPlayerVelocity(0); } // Hard lane top boundary for player
        return nextY;
      });

      // CPU Physics (Hard Lanes)
      setCpuY(prevY => {
        const speed = 2 + (progress / 30);
        const wave = Math.sin(time / 200) * speed;
        let nextY = prevY + wave;
        if (nextY > 42) nextY = 42; // Hard lane bottom boundary for CPU
        if (nextY < 8) nextY = 8;
        return nextY;
      });

      // World Movement
      setCollectibles(prev => {
        const speed = 80 + (progress / 2);
        return prev
          .map(c => ({ ...c, x: c.x - (speed * deltaTime) }))
          .filter(c => c.x > -10 && !c.collected);
      });

      // Spawning logic for 3 rounds
      spawnTimerRef.current += deltaTime;
      const spawnRate = round === 2 ? 1.0 : 0.45;
      if (spawnTimerRef.current > spawnRate) {
        spawnTimerRef.current = 0;
        const lane = Math.random() > 0.5 ? 'top' : 'bottom';

        if (round === 1) { // Round 1: Simple Quill Collection
          setCollectibles(prev => [...prev, {
            id: Date.now(), x: 110, y: lane === 'top' ? (15 + Math.random() * 20) : (65 + Math.random() * 20),
            lane: lane, type: 'quill', collected: false
          }]);
        } else if (round === 2) { // Round 2: Gate Runner (Upgrades/Downgrades)
          const playerGateValue = Math.random() > 0.4 ? '+10' : '-5';
          const cpuGateValue = Math.random() > 0.5 ? '+10' : '-5';
          setCollectibles(prev => [
            ...prev,
            { id: Date.now(), x: 110, y: 75, lane: 'bottom', type: 'gate', value: playerGateValue, collected: false },
            { id: Date.now() + 1, x: 110, y: 25, lane: 'top', type: 'gate', value: cpuGateValue, collected: false }
          ]);
        } else { // Round 3: Flask Sorting
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          setCollectibles(prev => [...prev, {
            id: Date.now(), x: 110, y: lane === 'top' ? (15 + Math.random() * 20) : (65 + Math.random() * 20),
            lane: lane, type: 'flask', color: randomColor, collected: false
          }]);
        }
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [playerVelocity, progress, round, colors]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  useEffect(() => {
    // Round 3 logic: periodically change target color
    if (round === 3) {
      const interval = setInterval(() => {
        setTargetColor(colors[Math.floor(Math.random() * colors.length)]);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [round, colors]);

  useEffect(() => {
    setCollectibles(prev => {
      let pHit = false; let cHit = false;
      let pDelta = 0; let cDelta = 0;

      const next = prev.map(c => {
        if (c.collected) return c;
        const dx = Math.abs(c.x - 20);
        if (dx < 7) {
          const charY = c.lane === 'bottom' ? playerY : cpuY;
          const dy = Math.abs(c.y - charY);

          // Gates are taller obstacles
          const threshold = c.type === 'gate' ? 25 : 10;

          if (dy < threshold) {
            if (c.lane === 'bottom') { pHit = true; pDelta = c.type === 'gate' ? parseInt(c.value || '0') : (c.type === 'flask' && c.color !== targetColor ? -2 : 1); }
            else { cHit = true; cDelta = c.type === 'gate' ? parseInt(c.value || '0') : (c.type === 'flask' && c.color !== targetColor ? -2 : 1); }
            return { ...c, collected: true };
          }
        }
        return c;
      });
      if (pHit) setPlayerScore(s => Math.max(0, s + pDelta));
      if (cHit) setCpuScore(s => Math.max(0, s + cDelta));
      return next;
    });
  }, [playerY, cpuY, round, targetColor]);

  const flap = (e: any) => { e.preventDefault(); setPlayerVelocity(-110); setIsFlapping(true); setTimeout(() => setIsFlapping(false), 100); };

  const getFlaskStyle = (color?: string) => {
    const map: Record<string, string> = { orange: '#F69338', teal: '#00AF42', navy: '#203A72', yellow: '#FCD000' };
    return { backgroundColor: map[color || 'orange'] };
  };

  return (
    <div className="fixed inset-0 bg-[#FAF9F6] overflow-hidden select-none cursor-pointer" onMouseDown={flap} onTouchStart={flap}>
      {/* SCORE HUD */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-12 z-50">
        <div className="text-center opacity-70">
          <p className="text-[10px] font-black text-brand-navy uppercase mb-1">CPU (Rawy)</p>
          <div className="bg-white px-5 py-1 rounded-full border shadow-sm font-black text-brand-navy text-xl">{cpuScore}</div>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-brand-orange uppercase mb-1">YOU (Hero)</p>
          <div className="bg-white ring-2 ring-brand-orange/40 px-6 py-1 rounded-full shadow-lg font-black text-brand-orange text-2xl scale-110">{playerScore}</div>
        </div>
      </div>

      {/* Track Visualization */}
      <div className="absolute inset-0 flex flex-col pointer-events-none opacity-10">
        <div className="h-1/2 border-b-8 border-dashed border-brand-navy bg-brand-navy/10"></div>
        <div className="h-1/2 bg-brand-orange/5"></div>
      </div>

      {/* Target Color HUD for Round 3 */}
      {round === 3 && (
        <div className="absolute top-44 left-1/2 -translate-x-1/2 bg-white/80 p-3 rounded-2xl shadow-md border animate-bounce z-50">
          <p className="text-[10px] font-black text-brand-navy uppercase mb-1">{t('اجمع اللون:', 'Sort Color:')}</p>
          <div className="w-8 h-8 rounded-lg border-2 border-white shadow-inner mx-auto" style={getFlaskStyle(targetColor)}></div>
        </div>
      )}

      {/* CHARACTERS */}
      <div className="absolute w-20 h-20 z-30 transition-all duration-300" style={{ left: '20%', top: `${cpuY}%`, transform: 'translate(-50%, -50%)', opacity: 0.85 }}>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl overflow-visible">
          <circle cx="100" cy="100" r="60" fill="#203A72" />
          <path d="M60,130 Q100,160 140,130 L130,170 Q100,180 70,170 Z" fill="#F69338" />
          <g><circle cx="80" cy="85" r="12" fill="white" /><circle cx="120" cy="85" r="12" fill="white" /><circle cx="82" cy="87" r="5" fill="#203A72" /><circle cx="118" cy="87" r="5" fill="#203A72" /></g>
          <path d="M92,100 L108,100 L100,115 Z" fill="#FCD000" />
        </svg>
      </div>

      <div className="absolute w-24 h-24 z-30" style={{ left: '20%', top: `${playerY}%`, transform: `translate(-50%, -50%) rotate(${playerVelocity * 0.15}deg)` }}>
        <div className={`w-full h-full rounded-full p-1 bg-white shadow-2xl overflow-hidden ring-4 ring-brand-orange transition-transform ${isFlapping ? 'scale-110' : 'scale-100'}`}>
          <img src={`data:image/jpeg;base64,${storyData?.styleReferenceImageBase64}`} className="w-full h-full object-cover rounded-full" alt="Player" />
        </div>
      </div>

      {/* GAME OBJECTS */}
      {collectibles.map(c => (
        <div key={c.id} className="absolute -translate-x-1/2 -translate-y-1/2 z-40" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
          {c.type === 'quill' && <span className="text-4xl filter drop-shadow-md">🖋️</span>}
          {c.type === 'flask' && (
            <div className="w-10 h-10 rounded-lg border-2 border-white shadow-lg flex items-center justify-center text-white font-bold" style={getFlaskStyle(c.color)}>
              🧪
            </div>
          )}
          {c.type === 'gate' && (
            <div className={`w-28 h-56 border-8 rounded-[2rem] flex flex-col items-center justify-center font-black shadow-2xl backdrop-blur-sm transition-all animate-pulse ${c.value?.startsWith('+') ? 'border-green-500 bg-green-500/20 text-green-600' : 'border-red-500 bg-red-500/20 text-red-600'}`}>
              <span className="text-4xl">{c.value}</span>
              <span className="text-[10px] uppercase tracking-tighter">{c.value?.startsWith('+') ? 'UPGRADE' : 'WEAK PLOT'}</span>
            </div>
          )}
        </div>
      ))}

      {/* STATUS UI */}
      <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-6 px-8 text-center pointer-events-none z-50">
        {error ? (
          <div className="bg-red-500/90 backdrop-blur-xl p-8 rounded-[2rem] border border-red-400 shadow-2xl animate-shake">
            <p className="text-white text-3xl mb-2">⚠️</p>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{t('حدث خطأ', 'Mission Failed')}</h2>
            <p className="text-white/80 font-mono text-xs mt-2">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-white text-red-600 rounded-full font-black text-[10px] pointer-events-auto hover:scale-105 transition-transform uppercase">
              {t('إعادة المحاولة', 'Restart Protocol')}
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white/50 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white/60 space-y-1 shadow-2xl">
              <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em]">{roundNames[round - 1]}</p>
              <h2 className="text-2xl font-black text-brand-navy uppercase italic drop-shadow-sm">{status}</h2>
            </div>
            <div className="w-full max-w-2xl space-y-2">
              <div className="flex justify-between px-2"><p className="text-[10px] font-black text-brand-navy/60 uppercase">{t('تقدم الإنتاج', 'AI Production Progress')}</p><p className="text-2xl font-black text-brand-orange font-mono">{Math.round(progress)}%</p></div>
              <div className="h-5 bg-white/80 rounded-full border-2 p-1 shadow-inner overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-orange via-brand-yellow to-brand-teal rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GeneratingScreen;
