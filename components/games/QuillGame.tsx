import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface QuillGameProps {
    onComplete?: () => void;
    characterImage?: string;
}

export const QuillGame: React.FC<QuillGameProps> = ({ onComplete, characterImage }) => {
    const [score, setScore] = useState(0);
    const [items, setItems] = useState<{ id: number; lane: 'top' | 'bottom'; x: number; collected: boolean }[]>([]);
    const [lane, setLane] = useState<'top' | 'bottom'>('bottom');
    const [isPlaying, setIsPlaying] = useState(true);

    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);
    const spawnTimerRef = useRef<number>(0);

    const SPEED = 0.5; // Moderate speed

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') setLane('top');
            if (e.key === 'ArrowDown') setLane('bottom');
        };
        const handleTouch = () => setLane(prev => prev === 'top' ? 'bottom' : 'top');

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('touchstart', handleTouch);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('touchstart', handleTouch);
        };
    }, []);

    const updateGame = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // Spawn Items
        spawnTimerRef.current += deltaTime;
        if (spawnTimerRef.current > 1200) {
            setItems(prev => [
                ...prev,
                {
                    id: Date.now(),
                    lane: Math.random() > 0.5 ? 'top' : 'bottom',
                    x: 100,
                    collected: false
                }
            ]);
            spawnTimerRef.current = 0;
        }

        // Move & Collide
        setItems(prev => {
            return prev.map(item => {
                // Move
                return { ...item, x: item.x - (SPEED * (deltaTime / 16)) };
            }).filter(item => {
                // Remove if off screen
                if (item.x < -10) return false;

                // Collision
                // Hero X is approx 20%. Width approx 10%. 
                if (!item.collected && item.x < 25 && item.x > 15 && item.lane === lane) {
                    item.collected = true;
                    setScore(s => s + 1);
                }
                return true;
            });
        });

        if (isPlaying) requestRef.current = requestAnimationFrame(updateGame);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updateGame);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, lane]);

    return (
        <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-[#FAF9F6] rounded-2xl border-4 border-brand-navy/10 select-none cursor-pointer" onClick={() => setLane(prev => prev === 'top' ? 'bottom' : 'top')}>

            {/* Background Decor */}
            <div className="absolute inset-0 opacity-10 flex flex-col pointer-events-none">
                <div className="h-1/2 bg-brand-navy/20 border-b-2 border-dashed border-brand-navy"></div>
                <div className="h-1/2 bg-brand-orange/20"></div>
            </div>

            {/* Score HUD */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-lg border border-brand-navy/20 z-20">
                <span className="text-2xl">🪶</span>
                <span className="font-black text-brand-navy text-xl ml-2">{score}</span>
            </div>

            {/* Hero */}
            <motion.div
                animate={{
                    top: lane === 'top' ? '25%' : '75%',
                }}
                className="absolute left-[20%] w-20 h-20 -translate-x-1/2 -translate-y-1/2 z-10"
            >
                {characterImage ? (
                    <img src={`data:image/jpeg;base64,${characterImage}`} className="w-full h-full rounded-full border-4 border-white shadow-xl object-cover" />
                ) : (
                    <div className="w-full h-full bg-brand-navy rounded-full border-4 border-white shadow-xl flex items-center justify-center text-3xl">🧙‍♂️</div>
                )}
            </motion.div>

            {/* Items */}
            {items.map(item => (
                <div
                    key={item.id}
                    className={`absolute z-10 transition-opacity ${item.collected ? 'opacity-0 scale-150' : 'opacity-100'}`}
                    style={{
                        left: `${item.x}%`,
                        top: item.lane === 'top' ? '25%' : '75%',
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <span className="text-4xl filter drop-shadow-md">🖋️</span>
                </div>
            ))}

            <div className="absolute bottom-4 inset-x-0 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest pointer-events-none">Tap to Switch Lanes</div>
        </div>
    );
};
