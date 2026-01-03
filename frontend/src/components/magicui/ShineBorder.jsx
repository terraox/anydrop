"use client"

import { cn } from "../../lib/utils"

/**
 * Shine Border
 *
 * An animated background border effect component with configurable properties.
 */
export default function ShineBorder({
  children,
  borderWidth = 1,
  duration = 14,
  shineColor = "#000000",
  className,
  style,
  ...props
}) {
  return (
    <div className={cn("relative h-full w-full rounded-[inherit] overflow-hidden", className)} {...props}>
      <div
        style={{
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          backgroundImage: `radial-gradient(transparent,transparent, ${Array.isArray(shineColor) ? shineColor.join(",") : shineColor
            },transparent,transparent)`,
          backgroundSize: "300% 300%",
          mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "var(--border-width)",
          ...style,
        }}
        className="motion-safe:animate-shine pointer-events-none absolute inset-0 size-full rounded-[inherit] will-change-[background-position] z-10"
      />
      <div className="relative z-0 h-full w-full">
        {children}
      </div>
    </div>
  )
}