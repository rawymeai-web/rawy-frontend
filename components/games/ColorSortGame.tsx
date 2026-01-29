
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ColorSortGameProps {
    onComplete?: () => void;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D']; // Coral, Teal, Yellow

export const ColorSortGame: React.FC<ColorSortGameProps> = ({ onComplete }) => {
    // Initial State: 3 Flasks with mixed colors, 1 Empty
    // Each flask has 3 segments maximum
    const [flasks, setFlasks] = useState<string[][]>([
        [COLORS[0], COLORS[1], COLORS[2]], // Mixed 1
        [COLORS[1], COLORS[2], COLORS[0]], // Mixed 2
        [COLORS[2], COLORS[0], COLORS[1]], // Mixed 3
        [] // Empty
    ]);

    const [selectedFlask, setSelectedFlask] = useState<number | null>(null);
    const [isWon, setIsWon] = useState(false);

    const handleFlaskClick = (index: number) => {
        if (isWon) return;

        // Deselect if clicking same
        if (selectedFlask === index) {
            setSelectedFlask(null);
            return;
        }

        // Select Source
        if (selectedFlask === null) {
            if (flasks[index].length > 0) {
                setSelectedFlask(index);
            }
            return;
        }

        // Move Logic
        const source = flasks[selectedFlask];
        const target = flasks[index];
        const colorToMove = source[source.length - 1];

        // Rules:
        // 1. Target not full (max 3?) Let's say max 4 for easier play
        // 2. Target empty OR Target top color == Source top color
        if (target.length < 4) {
            if (target.length === 0 || target[target.length - 1] === colorToMove) {
                // Valid Move
                const newFlasks = [...flasks];
                newFlasks[selectedFlask] = source.slice(0, -1);
                newFlasks[index] = [...target, colorToMove];
                setFlasks(newFlasks);
                setSelectedFlask(null);
                checkWin(newFlasks);
            } else {
                // Invalid - just deselect or shake?
                setSelectedFlask(null);
            }
        } else {
            setSelectedFlask(null);
        }
    };

    const checkWin = (currentFlasks: string[][]) => {
        // Win if all non-empty flasks have uniform colors AND are full(ish) or original count
        const isComplete = currentFlasks.every(f => {
            if (f.length === 0) return true;
            if (f.length !== 3) return false; // Must be full height (3 segments from init)
            return f.every(c => c === f[0]); // All same color
        });

        if (isComplete) {
            setIsWon(true);
            if (onComplete) setTimeout(onComplete, 1000);
        }
    };

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-4 border-dashed border-gray-200 p-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">
                {isWon ? "🎨 PALETTE MIXED!" : "🧪 SORT THE COLORS"}
            </h3>

            <div className="flex gap-4 items-end justify-center">
                {flasks.map((flask, i) => (
                    <div
                        key={i}
                        onClick={() => handleFlaskClick(i)}
                        className={`
                            relative w-12 h-32 border-b-4 border-x-4 border-gray-300 rounded-b-xl flex flex-col-reverse overflow-hidden transition-all cursor-pointer
                            ${selectedFlask === i ? 'ring-4 ring-brand-coral border-brand-coral -translate-y-2 shadow-xl' : 'hover:border-gray-400'}
                        `}
                    >
                        {flask.map((color, cIndex) => (
                            <motion.div
                                key={cIndex}
                                initial={{ height: 0 }}
                                animate={{ height: '25%' }} // 4 segments max = 25% each
                                className="w-full border-t border-white/20"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {isWon && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-6 px-6 py-2 bg-green-500 text-white rounded-full font-bold shadow-lg"
                >
                    Excellent Work!
                </motion.div>
            )}
        </div>
    );
};
