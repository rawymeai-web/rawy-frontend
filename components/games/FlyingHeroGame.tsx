
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlyingHeroGameProps {
    onComplete?: () => void;
    characterImage?: string;
}

export const FlyingHeroGame: React.FC<FlyingHeroGameProps> = ({ onComplete, characterImage }) => {
    const [lane, setLane] = useState(1);
    const [score, setScore] = useState(0);
    const [heroSize, setHeroSize] = useState(1); // 1 = normal, 0.5 = small, 1.5 = big
    const [items, setItems] = useState<{ id: number; lane: number; type: 'box' | 'gate-up' | 'gate-down'; x: number }[]>([]);
    const [isPlaying, setIsPlaying] = useState(true);
    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);
    const spawnTimerRef = useRef<number>(0);

    const LANES = [15, 50, 85];
    const SPEED = 0.3; // Slower pace

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') setLane(l => Math.max(0, l - 1));
            if (e.key === 'ArrowDown') setLane(l => Math.min(2, l + 1));
        };
        // Simple touch/click areas handled below
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const changeLane = (dir: 'up' | 'down') => {
        if (dir === 'up') setLane(prev => Math.max(0, prev - 1));
        else setLane(prev => Math.min(2, prev + 1));
    }

    const updateGame = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // Spawn Items
        spawnTimerRef.current += deltaTime;
        if (spawnTimerRef.current > 1200) {
            // Randomize lane more effectively
            const lane = Math.floor(Math.random() * 3);
            const typeProb = Math.random();
            // More variety: 60% box, 20% grow, 20% shrink
            const type = typeProb > 0.4 ? 'box' : (typeProb > 0.2 ? 'gate-up' : 'gate-down');

            setItems(prev => [...prev, {
                id: Date.now(),
                lane,
                type,
                x: 100
            }]);
            spawnTimerRef.current = 0;
        }

        setItems(prev => {
            const nextItems = prev.map(item => ({ ...item, x: item.x - (SPEED * (deltaTime / 16)) }))
                .filter(item => item.x > -15);

            // Collision
            // Hero Hitbox X: 20 -> 25 (depends on size)
            const collidedIdx = nextItems.findIndex(item => {
                const hitX = item.x < 25 && item.x > 15;
                const hitY = item.lane === lane;
                return hitX && hitY;
            });

            if (collidedIdx !== -1) {
                const item = nextItems[collidedIdx];
                if (item.type === 'box') {
                    setScore(s => s + 5);
                } else if (item.type === 'gate-up') {
                    setHeroSize(s => Math.min(2, s + 0.2));
                    setScore(s => s + 20);
                } else if (item.type === 'gate-down') {
                    setHeroSize(s => Math.max(0.5, s - 0.2));
                    setScore(s => Math.max(0, s - 10));
                }
                nextItems.splice(collidedIdx, 1);
            }
            return nextItems;
        });

        if (isPlaying) requestRef.current = requestAnimationFrame(updateGame);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updateGame);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, lane]);

    return (
        <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-gradient-to-r from-sky-200 to-indigo-200 rounded-2xl border-4 border-white/50 select-none shadow-inner">

            {/* Background Clouds or Pattern */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/clouds.png')] animate-slide-left"></div>

            {/* Lane Markers */}
            <div className="absolute inset-x-0 top-[33%] border-t border-white/20 border-dashed"></div>
            <div className="absolute inset-x-0 top-[66%] border-t border-white/20 border-dashed"></div>

            {/* Score */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border-2 border-brand-orange z-20">
                <span className="font-black text-brand-orange text-xl">⭐ {score}</span>
            </div>

            {/* Hero */}
            <motion.div
                animate={{
                    top: `${LANES[lane]}%`,
                    scale: heroSize,
                }}
                className="absolute left-[20%] w-16 h-16 origin-center z-10 -translate-y-1/2 -translate-x-1/2"
            >
                <div className={`relative w-full h-full p-1 rounded-full ${heroSize > 1.2 ? 'ring-4 ring-green-400' : heroSize < 0.8 ? 'ring-4 ring-red-400' : ''}`}>
                    {characterImage ? (
                        <img src={`data:image/jpeg;base64,${characterImage}`} className="w-full h-full rounded-full object-cover shadow-2xl" />
                    ) : (
                        <div className="w-full h-full bg-brand-orange rounded-full flex items-center justify-center text-3xl shadow-2xl">🦸</div>
                    )}
                    {/* Size Indicator Text */}
                    {heroSize !== 1 && (
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[9px] px-2 rounded-full whitespace-nowrap">
                            {heroSize > 1 ? 'POWER UP' : 'SHRINK'}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Items */}
            <AnimatePresence>
                {items.map(item => (
                    <motion.div
                        key={item.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transform transition-transform"
                        style={{
                            left: `${item.x}%`,
                            top: `${LANES[item.lane]}%`
                        }}
                    >
                        {item.type === 'box' && (
                            <div className="w-8 h-8 bg-brand-yellow border-2 border-brand-orange rounded-lg shadow-md rotate-12 flex items-center justify-center">
                                <span className="text-xs">🎁</span>
                            </div>
                        )}
                        {item.type === 'gate-up' && (
                            <div className="w-6 h-20 bg-green-500/20 border-2 border-green-400 rounded-full flex items-center justify-center animate-pulse">
                                <span className="text-green-600 font-bold text-xs rotate-90 whitespace-nowrap">GROW</span>
                            </div>
                        )}
                        {item.type === 'gate-down' && (
                            <div className="w-6 h-20 bg-red-500/20 border-2 border-red-400 rounded-full flex items-center justify-center animate-pulse">
                                <span className="text-red-600 font-bold text-xs rotate-90 whitespace-nowrap">SHRINK</span>
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute inset-0 z-20 flex flex-col">
                <div className="flex-1 active:bg-white/5 transition-colors cursor-pointer" onClick={() => changeLane('up')}></div>
                <div className="flex-1 active:bg-white/5 transition-colors cursor-pointer" onClick={() => changeLane('down')}></div>
            </div>
            <div className="absolute bottom-2 inset-x-0 text-center text-[9px] text-white/60 font-black uppercase tracking-widest pointer-events-none shadow-black drop-shadow-md">
                Tap Top/Bottom Zones to Fly
            </div>
        </div>
    );
};
