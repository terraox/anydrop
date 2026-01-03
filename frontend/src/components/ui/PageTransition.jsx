import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    in: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20,
            duration: 0.3
        }
    },
    out: {
        opacity: 0,
        scale: 1.02,
        y: -10,
        transition: {
            duration: 0.2
        }
    }
};

export default function PageTransition({ children, className }) {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
}
