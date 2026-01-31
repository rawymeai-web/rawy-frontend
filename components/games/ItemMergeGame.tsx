
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ItemMergeGameProps {
    onComplete?: () => void;
}

type ItemLevel = 1 | 2 | 3 | 4 | 5;
const ITEMS: Record<ItemLevel, string> = {
    1: '✏️', // Pencil
    2: '🖊️', // Pen
    3: '🖌️', // Brush
    4: '📸', // Camera
    5: '🪄'  // Wand
};

interface GridSlot {
    id: string; // Unique ID for keying
    level: ItemLevel;
}

export const ItemMergeGame: React.FC<ItemMergeGameProps> = ({ onComplete }) => {
    const [grid, setGrid] = useState<(GridSlot | null)[]>(Array(9).fill(null));
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [score, setScore] = useState(0);

    // Initial Spawn
    useEffect(() => {
        spawnItem();
        spawnItem();
        spawnItem();
    }, []);

    const spawnItem = () => {
        setGrid(prev => {
            const emptyIndices = prev.map((item, idx) => item === null ? idx : -1).filter(i => i !== -1);
            if (emptyIndices.length === 0) return prev;

            const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            const newGrid = [...prev];
            newGrid[randomIndex] = { id: Math.random().toString(), level: 1 };
            return newGrid;
        });
    };

    const handleSlotClick = (index: number) => {
        const item = grid[index];

        // If clicking empty slot
        if (!item) {
            // Move logic? Nah, simplistic merge only
            setSelectedSlot(null);
            return;
        }

        // If nothing selected, select this
        if (selectedSlot === null) {
            setSelectedSlot(index);
            return;
        }

        // If clicking same slot, deselect
        if (selectedSlot === index) {
            setSelectedSlot(null);
            return;
        }

        // If clicking another slot
        const source = grid[selectedSlot];
        if (source && source.level === item.level) {
            // MERGE!
            const newGrid = [...grid];
            const newLevel = Math.min(5, source.level + 1) as ItemLevel;

            newGrid[index] = { id: Math.random().toString(), level: newLevel }; // Upgrade target
            newGrid[selectedSlot] = null; // Clear source

            setGrid(newGrid);
            setSelectedSlot(null);
            setScore(s => s + (newLevel * 100)); // Score boost

            // Trigger "Win" or high tier effect?
            if (newLevel === 5 && onComplete) {
                setTimeout(onComplete, 1000);
            }

            // Spawn new fodder
            setTimeout(spawnItem, 1000);
        } else {
            // Swap or just change selection? Change selection feels better.
            setSelectedSlot(index);
        }
    };

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-indigo-50/50 rounded-2xl border-4 border-indigo-100 p-6 relative overflow-hidden">

            {/* Score / Header */}
            <div className="flex justify-between w-full mb-4 px-2">
                <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">MERGE STUDIO</span>
                <span className="text-xs font-black text-indigo-500">RES: {score}px</span>
            </div>

            {/* Help Overlay / Instructions */}
            <div className="absolute top-12 inset-x-0 text-center pointer-events-none opacity-50 z-0">
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Merge 2 Same Items to Upgrade!</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {grid.map((slot, i) => (
                    <motion.div
                        key={i}
                        layout
                        onClick={() => handleSlotClick(i)}
                        className={`
                            w-20 h-20 rounded-2xl flex items-center justify-center text-4xl cursor-pointer shadow-sm border-2 transition-all
                            ${slot ? 'bg-white' : 'bg-indigo-100/50 border-dashed border-indigo-200'}
                            ${selectedSlot === i ? 'ring-4 ring-indigo-400 border-indigo-500 scale-105 z-10' : 'border-indigo-100'}
                        `}
                    >
                        <AnimatePresence mode='popLayout'>
                            {slot && (
                                <motion.span
                                    key={slot.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                >
                                    {ITEMS[slot.level]}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            <button onClick={spawnItem} className="mt-6 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-600">
                + Request Supplies
            </button>
        </div>
    );
};
