
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

  const round = progress < 33 ? 1 : progress < 66 ? 2 : 3;
  const roundNames = [
    t('المسودة: جمع ريش الكتابة', 'Drafting: Collecting Magic Quills'),
    t('التخطيط: بوابات الحبكة', 'Plotting: Navigating Story Gates'),
    t('التلوين: فرز قوارير الحبر', 'Coloring: Sorting Ink Flasks')
  ];

  const colors = ['orange', 'teal', 'navy', 'yellow'];

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      setPlayerY(prevY => {
        const gravity = 150;
        const newVel = playerVelocity + (gravity * deltaTime);
        setPlayerVelocity(newVel);
        let nextY = prevY + (newVel * deltaTime * 0.1);
        if (nextY > 92) { nextY = 92; setPlayerVelocity(0); }
        if (nextY < 58) { nextY = 58; setPlayerVelocity(0); }
        return nextY;
      });
      setCpuY(prevY => {
        const speed = 2 + (progress / 30);
        const wave = Math.sin(time / 200) * speed;
        let nextY = prevY + wave;
        if (nextY > 42) nextY = 42;
        if (nextY < 8) nextY = 8;
        return nextY;
      });
      setCollectibles(prev => {
        const speed = 80 + (progress / 2);
        return prev
          .map(c => ({ ...c, x: c.x - (speed * deltaTime) }))
          .filter(c => c.x > -10 && !c.collected);
      });
      spawnTimerRef.current += deltaTime;
      const spawnRate = round === 2 ? 1.0 : 0.45;
      if (spawnTimerRef.current > spawnRate) {
        spawnTimerRef.current = 0;
        const lane = Math.random() > 0.5 ? 'top' : 'bottom';
        if (round === 1) {
          setCollectibles(prev => [...prev, {
            id: Date.now(), x: 110, y: lane === 'top' ? (15 + Math.random() * 20) : (65 + Math.random() * 20),
            lane: lane, type: 'quill', collected: false
          }]);
        } else if (round === 2) {
          const playerGateValue = Math.random() > 0.4 ? '+10' : '-5';
          const cpuGateValue = Math.random() > 0.5 ? '+10' : '-5';
          setCollectibles(prev => [
            ...prev,
            { id: Date.now(), x: 110, y: 75, lane: 'bottom', type: 'gate', value: playerGateValue, collected: false },
            { id: Date.now() + 1, x: 110, y: 25, lane: 'top', type: 'gate', value: cpuGateValue, collected: false }
          ]);
        } else {
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

  const flap = (e: any) => { 
    e.preventDefault(); 
    setPlayerVelocity(-130); 
    setIsFlapping(true); 
    setTimeout(() => setIsFlapping(false), 150); 
  };

  const getFlaskStyle = (color?: string) => {
    const map: Record<string, string> = { orange: '#F78F50', teal: '#006B5D', navy: '#001A40', yellow: '#FCD000' };
    return { backgroundColor: map[color || 'orange'] };
  };

  return (
    <div className="fixed inset-0 bg-[#FFF9F0] overflow-hidden select-none cursor-pointer" onMouseDown={flap} onTouchStart={flap}>
      
      {/* Background Blobs */}
      <div className="blob-bg opacity-30">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* SCORE HUD */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex gap-12 z-50">
        <div className="text-center">
          <p className="text-[10px] font-black text-brand-navy/30 uppercase tracking-[0.2em] mb-2">FACTORY AI</p>
          <div className="glass-panel px-6 py-2 rounded-full font-black text-brand-navy text-xl shadow-xl">{cpuScore}</div>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mb-2">OUR HERO</p>
          <div className="glass-panel border-brand-orange/20 px-8 py-2 rounded-full shadow-2xl font-black text-brand-orange text-3xl scale-110">{playerScore}</div>
        </div>
      </div>

      {/* Target Color HUD for Round 3 */}
      {round === 3 && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 glass-panel p-4 rounded-3xl shadow-2xl border-brand-teal/20 animate-bounce z-50">
          <p className="text-[10px] font-black text-brand-teal uppercase tracking-widest mb-2 text-center">{t('اجمع اللون:', 'Sort Color:')}</p>
          <div className="w-10 h-10 rounded-xl border-4 border-white/50 shadow-inner mx-auto" style={getFlaskStyle(targetColor)}></div>
        </div>
      )}

      {/* CHARACTERS */}
      <div className="absolute w-24 h-24 z-30 transition-all duration-300" style={{ left: '20%', top: `${cpuY}%`, transform: 'translate(-50%, -50%)', opacity: 0.9 }}>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl overflow-visible">
          <circle cx="100" cy="100" r="70" fill="#001A40" />
          <path d="M50,130 Q100,170 150,130 L140,180 Q100,195 60,180 Z" fill="#F78F50" />
          <g>
            <circle cx="75" cy="85" r="15" fill="white" />
            <circle cx="125" cy="85" r="15" fill="white" />
            <circle cx="78" cy="88" r="7" fill="#001A40" />
            <circle cx="122" cy="88" r="7" fill="#001A40" />
          </g>
          <path d="M90,110 L110,110 L100,125 Z" fill="#FCD000" />
        </svg>
      </div>

      <div className="absolute w-28 h-28 z-30" style={{ left: '20%', top: `${playerY}%`, transform: `translate(-50%, -50%) rotate(${playerVelocity * 0.1}deg)` }}>
        <div className={`w-full h-full rounded-[2rem] p-2 glass-panel border-4 border-brand-orange shadow-2xl overflow-hidden transition-transform duration-300 ${isFlapping ? 'scale-110 shadow-brand-orange/30' : 'scale-100'}`}>
          <img src={`data:image/jpeg;base64,${storyData?.styleReferenceImageBase64}`} className="w-full h-full object-cover rounded-[1.5rem]" alt="Player" />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/20 to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* GAME OBJECTS */}
      {collectibles.map(c => (
        <div key={c.id} className="absolute -translate-x-1/2 -translate-y-1/2 z-40" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
          {c.type === 'quill' && (
            <div className="text-5xl filter drop-shadow-2xl animate-float">🖋️</div>
          )}
          {c.type === 'flask' && (
            <div className="w-12 h-12 rounded-2xl border-4 border-white/50 shadow-2xl flex items-center justify-center text-white text-2xl animate-spin-slow" style={getFlaskStyle(c.color)}>
              🧪
            </div>
          )}
          {c.type === 'gate' && (
            <div className={`w-32 h-64 border-8 rounded-[3rem] flex flex-col items-center justify-center font-black shadow-2xl backdrop-blur-md transition-all animate-pulse ${c.value?.startsWith('+') ? 'border-brand-teal bg-brand-teal/20 text-brand-teal' : 'border-red-500 bg-red-500/20 text-red-600'}`}>
              <span className="text-5xl mb-2">{c.value}</span>
              <span className="text-[10px] uppercase tracking-widest">{c.value?.startsWith('+') ? 'UPGRADE' : 'GLITCH'}</span>
            </div>
          )}
        </div>
      ))}

      {/* STATUS UI */}
      <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-6 px-8 text-center pointer-events-none z-50">
        {error ? (
          <div className="glass-panel bg-red-500/10 p-10 rounded-[3rem] border-red-500/30 shadow-2xl animate-shake pointer-events-auto">
            <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
            <h2 className="text-2xl font-black text-brand-navy uppercase tracking-tight">{t('تعطلت المصنع', 'Factory Glitch')}</h2>
            <p className="text-brand-navy/60 font-medium text-sm mt-2 max-w-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-8 px-10 py-4 bg-brand-navy text-white rounded-full font-black text-xs hover:scale-105 transition-transform uppercase tracking-widest shadow-xl">
              {t('إعادة التشغيل', 'Reboot System')}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl space-y-8">
            <div className="glass-panel py-6 px-12 rounded-[2.5rem] inline-block mx-auto border-white/40 shadow-2xl">
              <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.4em] mb-1">{roundNames[round - 1]}</p>
              <h2 className="text-3xl font-black text-brand-navy uppercase tracking-tight drop-shadow-sm">{status}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end px-4">
                <div className="text-left">
                   <p className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest">{t('حالة الإنتاج', 'PRODUCTION STATUS')}</p>
                   <p className="text-lg font-black text-brand-navy">{t('تحويل الخيال إلى واقع...', 'Crafting Magic...')}</p>
                </div>
                <p className="text-4xl font-black text-brand-orange font-mono leading-none tracking-tighter">{Math.round(progress)}%</p>
              </div>
              <div className="h-6 bg-white/50 rounded-full border-4 border-white shadow-inner overflow-hidden p-1">
                <div className="h-full bg-gradient-to-r from-brand-orange via-brand-teal to-brand-navy rounded-full transition-all duration-1000 ease-out relative group" style={{ width: `${progress}%` }}>
                   <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <p className="text-[10px] font-black text-brand-navy/30 uppercase tracking-[0.2em]">{t('المس على الشاشة للقفز وتجنب العقبات!', 'TAP TO JUMP AND COLLECT MAGIC!')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratingScreen;
