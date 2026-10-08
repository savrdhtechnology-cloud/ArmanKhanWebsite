import React from "react";
import { motion } from "framer-motion";
import { Scissors } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

export const Divider = ({ className = "" }) => (
  <motion.div
    className={`flex items-center justify-center gap-4 my-6 ${className}`}
    data-testid="scissor-divider"
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.8 }}
  >
    <motion.div
      className="h-[1px] w-12 bg-brand-gold/50"
      style={{ transformOrigin: "100% 50%" }}
      variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.8, ease: EASE } } }}
    />
    <motion.span
      className="inline-flex"
      variants={{
        hidden: { opacity: 0, rotate: -180, scale: 0.4 },
        show: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.8, ease: EASE, delay: 0.15 } },
      }}
    >
      <Scissors className="w-4 h-4 text-brand-gold" strokeWidth={1.5} />
    </motion.span>
    <motion.div
      className="h-[1px] w-12 bg-brand-gold/50"
      style={{ transformOrigin: "0% 50%" }}
      variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.8, ease: EASE } } }}
    />
  </motion.div>
);

export const SectionLabel = ({ children }) => (
  <motion.span
    className="text-brand-gold font-manrope text-xs sm:text-sm uppercase tracking-[0.3em] block mb-3"
    initial={{ opacity: 0, letterSpacing: "0.6em" }}
    whileInView={{ opacity: 1, letterSpacing: "0.3em" }}
    viewport={{ once: true, amount: 0.8 }}
    transition={{ duration: 0.9, ease: EASE }}
  >
    {children}
  </motion.span>
);

export const SectionTitle = ({ children, className = "" }) => (
  <motion.h2
    className={`font-playfair text-4xl sm:text-5xl lg:text-6xl text-white leading-tight ${className}`}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
  >
    {children}
  </motion.h2>
);
