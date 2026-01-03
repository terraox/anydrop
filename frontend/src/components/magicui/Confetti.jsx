"use client";

import React, {
    createContext,
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";
import confetti from "canvas-confetti";

// Confetti API type
const ConfettiContext = createContext({});

// Main Confetti Component
const ConfettiComponent = forwardRef((props, ref) => {
    const {
        options,
        globalOptions = { resize: true, useWorker: true },
        manualstart = false,
        children,
        ...rest
    } = props;
    const instanceRef = useRef(null);

    const canvasRef = useCallback(
        (node) => {
            if (node !== null) {
                if (instanceRef.current) return;
                instanceRef.current = confetti.create(node, {
                    ...globalOptions,
                    resize: true,
                });
            } else {
                if (instanceRef.current) {
                    instanceRef.current.reset();
                    instanceRef.current = null;
                }
            }
        },
        [globalOptions]
    );

    const fire = useCallback(
        async (opts = {}) => {
            try {
                await instanceRef.current?.({ ...options, ...opts });
            } catch (error) {
                console.error("Confetti error:", error);
            }
        },
        [options]
    );

    const api = useMemo(
        () => ({
            fire,
        }),
        [fire]
    );

    useImperativeHandle(ref, () => api, [api]);

    useEffect(() => {
        if (!manualstart) {
            (async () => {
                try {
                    await fire();
                } catch (error) {
                    console.error("Confetti effect error:", error);
                }
            })();
        }
    }, [manualstart, fire]);

    return (
        <ConfettiContext.Provider value={api}>
            <canvas ref={canvasRef} {...rest} />
            {children}
        </ConfettiContext.Provider>
    );
});

ConfettiComponent.displayName = "Confetti";

export const Confetti = ConfettiComponent;

// Simple fire function for direct use
export const fireConfetti = (options = {}) => {
    const defaults = {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#10B981', '#34D399'],
        zIndex: 9999,
    };

    confetti({
        ...defaults,
        ...options,
    });
};

// Side cannons effect (celebratory)
export const fireSideCannons = () => {
    const end = Date.now() + 300;
    const colors = ['#8B5CF6', '#10B981', '#F59E0B'];

    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
            zIndex: 9999,
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
            zIndex: 9999,
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
};

export default Confetti;
