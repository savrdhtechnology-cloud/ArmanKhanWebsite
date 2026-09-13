import React from "react";
import { Scissors } from "lucide-react";

export const Divider = ({ className = "" }) => (
  <div className={`flex items-center justify-center gap-4 my-6 ${className}`} data-testid="scissor-divider">
    <div className="h-[1px] w-12 bg-brand-gold/50" />
    <Scissors className="w-4 h-4 text-brand-gold" strokeWidth={1.5} />
    <div className="h-[1px] w-12 bg-brand-gold/50" />
  </div>
);

export const SectionLabel = ({ children }) => (
  <span className="text-brand-gold font-manrope text-xs sm:text-sm uppercase tracking-[0.3em] block mb-3">
    {children}
  </span>
);

export const SectionTitle = ({ children, className = "" }) => (
  <h2 className={`font-playfair text-4xl sm:text-5xl lg:text-6xl text-white leading-tight ${className}`}>
    {children}
  </h2>
);
