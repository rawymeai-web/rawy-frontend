
import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

const pageVariants = {
    initial: {
        opacity: 0,
        x: 20,
        scale: 0.98,
        filter: "blur(10px)"
    },
    in: {
        opacity: 1,
        x: 0,
        scale: 1,
        filter: "blur(0px)"
    },
    out: {
        opacity: 0,
        scale: 1.05,
        filter: "blur(5px)"
    }
};

const pageTransition = {
    type: "tween",
    ease: [0.34, 1.56, 0.64, 1], // The "Secret Sauce" cubic-bezier
    duration: 0.5
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = "w-full h-full" }) => {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className={className}
        >
            {children}
        </motion.div>
    );
};
