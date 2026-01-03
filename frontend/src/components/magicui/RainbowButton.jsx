import React from "react";
import { cn } from "../../lib/utils";

export function RainbowButton({
    children,
    className,
    ...props
}) {
    return (
        <button
            className={cn(
                "group relative inline-flex h-11 animate-rainbow cursor-pointer items-center justify-center rounded-xl border-0 bg-[length:200%] px-8 py-2 font-medium text-white transition-colors [background-image:linear-gradient(to_right,#9333ea,#c084fc,#9333ea)] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
