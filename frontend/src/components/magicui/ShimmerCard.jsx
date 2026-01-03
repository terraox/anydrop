import React from "react";
import { cn } from "../../lib/utils";

export default function ShimmerCard({
    shimmerColor = "#8B5CF6",
    shimmerSize = "0.05em",
    shimmerDuration = "3s",
    borderRadius = "20px",
    background = "white",
    className,
    children,
    ...props
}) {
    return (
        <div
            style={{
                "--spread": "90deg",
                "--shimmer-color": shimmerColor,
                "--radius": borderRadius,
                "--speed": shimmerDuration,
                "--cut": shimmerSize,
                "--bg": background,
            }}
            className={cn(
                "group relative z-0 flex flex-col items-center justify-center overflow-hidden border border-white/10 [border-radius:var(--radius)]",
                className,
            )}
            {...props}
        >
            {/* spark container - Glow Layer */}
            <div
                className={cn(
                    "-z-30 blur-[4px]",
                    "absolute inset-0 overflow-visible [container-type:size]",
                    "p-[var(--cut)]"
                )}
                style={{
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMaskComposite: "xor",
                }}
            >
                <div className="absolute inset-0 h-[100cqh] animate-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
                    <div className="animate-spin-around absolute inset-[-100%] w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
                </div>
            </div>

            {/* spark container - Sharp Layer */}
            <div
                className={cn(
                    "-z-30",
                    "absolute inset-0 overflow-visible [container-type:size]",
                    "p-[var(--cut)]"
                )}
                style={{
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMaskComposite: "xor",
                }}
            >
                <div className="absolute inset-0 h-[100cqh] animate-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
                    <div className="animate-spin-around absolute inset-[-100%] w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
                </div>
            </div>

            {/* Content wrapper */}
            <div className="relative z-10 w-full rounded-[inherit]">
                {children}
            </div>

            {/* Background container - Separate layer for the card background */}
            <div
                className={cn(
                    "absolute -z-20 inset-0 [background:var(--bg)] [border-radius:var(--radius)]",
                )}
            />
        </div>
    );
}
