import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

const pageVariants = {
    initial: {
        opacity: 0,
        x: 16,
        scale: 0.99,
        filter: "blur(4px)"
    },
    in: {
        opacity: 1,
        x: 0,
        scale: 1,
        filter: "blur(0px)"
    },
    out: {
        opacity: 0,
        x: -16,
        scale: 0.99,
        filter: "blur(4px)"
    }
};

const pageTransition = {
    type: "spring",
    bounce: 0,
    duration: 0.4
};

const reducedVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 }
};

const reducedTransition = {
    type: "tween",
    ease: "linear",
    duration: 0.2
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = "w-full h-full" }) => {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={shouldReduceMotion ? reducedVariants : pageVariants}
            transition={shouldReduceMotion ? reducedTransition : pageTransition}
            className={className}
        >
            {children}
        </motion.div>
    );
};
