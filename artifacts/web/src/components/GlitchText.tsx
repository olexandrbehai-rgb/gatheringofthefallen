import React from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function GlitchText({ children, className, ...props }: GlitchTextProps) {
  return (
    <span className={cn("glitch-hover glitch-text cursor-pointer", className)} {...props}>
      {children}
    </span>
  );
}
