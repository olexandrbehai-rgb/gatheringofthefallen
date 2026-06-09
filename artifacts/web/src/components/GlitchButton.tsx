import React from "react";
import { cn } from "@/lib/utils";

interface GlitchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function GlitchButton({ children, className, ...props }: GlitchButtonProps) {
  return (
    <button 
      className={cn(
        "glitch-btn px-6 py-2 border border-primary/50 bg-black/50 text-primary font-mono uppercase tracking-widest",
        "transition-all duration-200 hover:bg-primary/20 hover:border-primary",
        "hover:scale-105 hover:brightness-110 hover:shadow-[0_0_30px_#ff4500,0_0_55px_rgba(139,0,0,0.85)]",
        "glitch-hover",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
