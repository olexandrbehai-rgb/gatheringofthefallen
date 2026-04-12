import React from "react";
import { cn } from "@/lib/utils";

interface GlitchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function GlitchButton({ children, className, ...props }: GlitchButtonProps) {
  return (
    <button 
      className={cn(
        "px-6 py-2 border border-primary/50 bg-black/50 text-primary font-mono uppercase tracking-widest",
        "hover:bg-primary/20 hover:border-primary transition-all duration-200",
        "glitch-hover",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
