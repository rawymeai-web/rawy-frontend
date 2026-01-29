import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { coverImageData } from './coverImageData';

export const HeroGallery: React.FC = () => {
    // Featured books cycle
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % coverImageData.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const activeImage = coverImageData[activeIndex];
    const nextImage = coverImageData[(activeIndex + 1) % coverImageData.length];
    const prevImage = coverImageData[(activeIndex - 1 + coverImageData.length) % coverImageData.length];

    return (
        <div className="w-full relative h-[500px] flex items-center justify-center overflow-hidden perspective-2000">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 z-0"></div>

            {/* Floating Graphics (Stars/Swirls) */}
            <motion.div
                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 left-[10%] text-brand-yellow z-0 opacity-60"
            >
                <svg width="60" height="60" viewBox="0 0 48 48" fill="currentColor"><path d="M24 0L26 18L44 20L26 22L24 40L22 22L4 20L22 18Z" /></svg>
            </motion.div>

            <motion.div
                animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-20 right-[15%] text-brand-teal z-0 opacity-40"
            >
                <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
            </motion.div>

            {/* 3D Book Showcase */}
            <div className="relative z-10 w-full max-w-lg h-full flex items-center justify-center preserve-3d">

                {/* Background Book (Previous) - Left & Blurred */}
                <motion.div
                    key={`prev-${activeIndex}`}
                    initial={{ x: -100, opacity: 0, scale: 0.8, rotateY: 15 }}
                    animate={{ x: -250, opacity: 0.4, scale: 0.7, rotateY: 30 }}
                    transition={{ duration: 0.8 }}
                    className="absolute shadow-2xl rounded-r-lg"
                >
                    <img src={prevImage} className="h-48 md:h-64 rounded-r-lg shadow-xl opacity-60 grayscale blur-[2px]" alt="Previous Book" />
                </motion.div>

                {/* Background Book (Next) - Right & Blurred */}
                <motion.div
                    key={`next-${activeIndex}`}
                    initial={{ x: 100, opacity: 0, scale: 0.8, rotateY: -15 }}
                    animate={{ x: 250, opacity: 0.4, scale: 0.7, rotateY: -30 }}
                    transition={{ duration: 0.8 }}
                    className="absolute shadow-2xl rounded-r-lg"
                >
                    <img src={nextImage} className="h-48 md:h-64 rounded-r-lg shadow-xl opacity-60 grayscale blur-[2px]" alt="Next Book" />
                </motion.div>

                {/* HERO BOOK - Center, Floating, Glowing */}
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, y: 50, scale: 0.9, rotateY: 10 }}
                        animate={{ opacity: 1, y: 0, scale: 1.1, rotateY: -5 }}
                        exit={{ opacity: 0, y: -50, scale: 1, rotateY: -20 }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className="relative z-20"
                    >
                        {/* Book Spine & Cover Container */}
                        <div className="relative group cursor-pointer perspective-1000">
                            <motion.img
                                src={activeImage}
                                alt="Active Book"
                                animate={{ rotateY: [-5, 5, -5] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="h-72 md:h-96 w-auto rounded-r-xl rounded-l-md shadow-[20px_20px_60px_rgba(0,0,0,0.3)] border-l-8 border-gray-100 ring-1 ring-white/50"
                            />
                            {/* Magical Glow */}
                            <div className="absolute -inset-4 bg-brand-orange/20 blur-3xl -z-10 rounded-full animate-pulse"></div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
