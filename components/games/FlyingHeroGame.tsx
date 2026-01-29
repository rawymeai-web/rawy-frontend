
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlyingHeroGameProps {
    onComplete?: () => void;
    characterImage?: string; // Optional custom character
}

export const FlyingHeroGame: React.FC<FlyingHeroGameProps> = ({ onComplete, characterImage }) => {
    const [lane, setLane] = useState(1); // 0: Top, 1: Middle, 2: Bottom
    const [score, setScore] = useState(0);
    const [items, setItems] = useState<{ id: number; lane: number; type: 'coin' | 'obstacle'; x: number }[]>([]);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isWon, setIsWon] = useState(false);
    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);
    const spawnTimerRef = useRef<number>(0);

    // Constants
    const LANES = [15, 50, 85]; // % positions
    const SPEED = 0.4; // Speed of scroll (Reduced from 0.8)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') setLane(l => Math.max(0, l - 1));
            if (e.key === 'ArrowDown') setLane(l => Math.min(2, l + 1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const changeLane = (direction: 'up' | 'down') => {
        if (direction === 'up') setLane(prev => Math.max(0, prev - 1));
        else setLane(prev => Math.min(2, prev + 1));
    };

    const updateGame = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // Spawn Items
        spawnTimerRef.current += deltaTime;
        if (spawnTimerRef.current > 2500) { // Spawn every 2.5s (Increased from 1.5s)
            setItems(prev => [
                ...prev,
                {
                    id: Date.now(),
                    lane: Math.floor(Math.random() * 3),
                    type: Math.random() > 0.3 ? 'coin' : 'obstacle',
                    x: 100 // Start at right edge
                }
            ]);
            spawnTimerRef.current = 0;
        }

        // Move Items & Collision
        setItems(prev => {
            const nextItems = prev.map(item => ({ ...item, x: item.x - (SPEED * (deltaTime / 16)) }))
                .filter(item => item.x > -10);

            // Simple Collision Check
            // Hero is approx at x=20, width=10
            nextItems.forEach(item => {
                if (item.x < 25 && item.x > 15 && item.lane === lane) {
                    // COllision!
                    if (item.type === 'coin') {
                        // We "collected" it - visually hide it (logic handled by skipping in render or state update)
                        // In a real game we'd splice it out, but for this lightweight loop we'll mark it distinct or just let it pass
                    }
                }
            });

            // Better collision handling: remove item if hit
            const collidedIndex = nextItems.findIndex(item => item.x < 25 && item.x > 15 && item.lane === lane);
            if (collidedIndex !== -1) {
                const item = nextItems[collidedIndex];
                if (item.type === 'coin') {
                    setScore(s => {
                        const newScore = s + 10;
                        if (newScore >= 100) setIsWon(true);
                        return newScore;
                    });
                } else {
                    setScore(s => Math.max(0, s - 5));
                    // Screenshake or red flash?
                }
                nextItems.splice(collidedIndex, 1);
            }

            return nextItems;
        });

        if (isPlaying) {
            requestRef.current = requestAnimationFrame(updateGame);
        }
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updateGame);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, lane]); // Re-bind if lane changes for scope access (though refs are better)

    return (
        <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl border-4 border-brand-navy/10 select-none">

            {/* Background Parallax (Simplified) */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-slide-left"></div>

            {/* Lanes */}
            <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none">
                <div className="h-full border-b border-dashed border-gray-300 mx-4"></div>
                <div className="h-full border-b border-dashed border-gray-300 mx-4"></div>
            </div>

            {/* Score */}
            <div className="absolute top-4 right-4 z-20 bg-white px-4 py-2 rounded-full shadow-lg font-black text-brand-navy border-2 border-brand-yellow">
                ⭐ {score}
            </div>

            {/* Hero */}
            <motion.div
                animate={{
                    top: `${LANES[lane]}%`,
                    y: '-50%'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute left-[20%] w-16 h-16 z-10"
            >
                {/* Use provided character or fallback */}
                {characterImage ? (
                    <img src={`data:image/jpeg;base64,${characterImage}`} className="w-full h-full rounded-full border-4 border-white shadow-xl object-cover" />
                ) : (
                    <div className="w-full h-full bg-brand-orange rounded-full border-4 border-white shadow-xl flex items-center justify-center text-2xl">🦸</div>
                )}
                {/* Jetpack Glare */}
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-2 bg-orange-400 rounded-l-full animate-pulse"></div>
            </motion.div>

            {/* Items */}
            {items.map(item => (
                <div
                    key={item.id}
                    className="absolute z-10 w-12 h-12 flex items-center justify-center text-3xl transition-transform"
                    style={{
                        left: `${item.x}%`,
                        top: `${LANES[item.lane]}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {item.type === 'coin' ? '✨' : '🌪️'}
                </div>
            ))}

            {/* Controls Overlay (Mobile Friendly) */}
            <div className="absolute inset-0 z-20 flex flex-col">
                <div className="flex-1 active:bg-white/10 transition-colors cursor-pointer" onClick={() => changeLane('up')}></div>
                <div className="flex-1 active:bg-white/10 transition-colors cursor-pointer" onClick={() => changeLane('down')}></div>
            </div>

            <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest pointer-events-none">
                Tap Top/Bottom to Fly
            </div>

            {isWon && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl transform animate-bounce-in text-center">
                        <div className="text-5xl mb-2">🏆</div>
                        <h4 className="text-xl font-black text-brand-navy uppercase">Level Complete!</h4>
                        <p className="text-sm text-gray-500 font-bold">Great flying!</p>
                    </div>
                </div>
            )}
        </div>
    );
};
