import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/** Animate a number from 0 → target when scrolled into view. */
export function CountUp({ end = 0, duration = 1600, suffix = "", className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return <span ref={ref} className={className}>{val.toLocaleString()}{suffix}</span>;
}

/** Split-text animated reveal — each letter fades up. */
export function SplitReveal({ text, className = "", delay = 0, stagger = 0.04 }) {
  const chars = text.split("");
  return (
    <motion.span
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {chars.map((c, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: "50%", rotateX: -90 },
            visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          {c === " " ? "\u00A0" : c}
        </motion.span>
      ))}
    </motion.span>
  );
}

/** Gold shimmer text — animated gradient sweep */
export const Shimmer = ({ children, className = "" }) => (
  <span
    className={`inline-block bg-clip-text text-transparent ${className}`}
    style={{
      backgroundImage: "linear-gradient(110deg, #C9A961 30%, #FFF3C4 45%, #C9A961 60%)",
      backgroundSize: "200% 100%",
      animation: "shimmer-sweep 3s linear infinite",
    }}
  >
    {children}
  </span>
);

/** Infinite marquee strip */
export const Marquee = ({ items, className = "" }) => (
  <div className={`overflow-hidden ${className}`}>
    <div className="flex whitespace-nowrap gap-8" style={{ animation: "marquee 30s linear infinite" }}>
      {[...items, ...items, ...items].map((t, i) => (
        <span key={i} className="flex items-center gap-8 font-playfair text-2xl md:text-4xl text-white/40 italic">
          {t}
          <span className="text-brand-gold text-3xl">✂</span>
        </span>
      ))}
    </div>
  </div>
);
