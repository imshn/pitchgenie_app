"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#262626",
  gradientOpacity = 0.8,
  ...props
}: MagicCardProps) {
  const mouseX = React.useRef(0);
  const mouseY = React.useRef(0);

  return (
    <div
      onMouseMove={(e) => {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.current = e.clientX - left;
        mouseY.current = e.clientY - top;
      }}
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-card text-card-foreground shadow-sm border border-border",
        className
      )}
      {...props}
    >
      <div className="relative z-10 h-full">{children}</div>
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(${gradientSize}px circle at ${mouseX.current}px ${mouseY.current}px, ${gradientColor}, transparent 100%)`,
          opacity: gradientOpacity,
        }}
      />
    </div>
  );
}
