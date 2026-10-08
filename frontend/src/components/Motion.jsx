import React, { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * Shared Framer Motion toolkit used across every page.
 * All reveals run once when the element scrolls into view.
 * Motion is automatically reduced for users who prefer reduced motion
 * (see <MotionConfig reducedMotion="user"> in Layout).
 */

export const EASE = [0.22, 1, 0.36, 1];

const OFFSETS = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: -50 },
  right: { x: 50 },
  scale: { scale: 0.92 },
  none: {},
};

const hiddenFor = (direction, distance) => {
  const base = OFFSETS[direction] || OFFSETS.up;
  if (distance == null) return { opacity: 0, ...base };
  const scaled = {};
  Object.keys(base).forEach((k) => {
    scaled[k] = k === "scale" ? base[k] : Math.sign(base[k]) * distance;
  });
  return { opacity: 0, ...scaled };
};

const SHOWN = { opacity: 1, x: 0, y: 0, scale: 1 };

const tagFor = (as) => motion[as] || motion.div;

/** Fade + slide an element in when it enters the viewport. */
export const Reveal = ({
  as = "div",
  children,
  direction = "up",
  distance,
  delay = 0,
  duration = 0.8,
  amount = 0.2,
  once = true,
  ...rest
}) => {
  const Comp = tagFor(as);
  return (
    <Comp
      initial={hiddenFor(direction, distance)}
      whileInView={SHOWN}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Comp>
  );
};

/** Container that staggers its <StaggerItem> children into view. */
export const Stagger = ({
  as = "div",
  children,
  stagger = 0.1,
  delay = 0,
  amount = 0.15,
  once = true,
  animateOnMount = false,
  ...rest
}) => {
  const Comp = tagFor(as);
  const trigger = animateOnMount
    ? { animate: "show" }
    : { whileInView: "show", viewport: { once, amount } };
  return (
    <Comp
      initial="hidden"
      {...trigger}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      {...rest}
    >
      {children}
    </Comp>
  );
};

/** Child of <Stagger>; inherits the parent's animation timing. */
export const StaggerItem = ({ as = "div", children, direction = "up", distance, duration = 0.7, ...rest }) => {
  const Comp = tagFor(as);
  return (
    <Comp
      variants={{
        hidden: hiddenFor(direction, distance),
        show: { ...SHOWN, transition: { duration, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </Comp>
  );
};

/** Curtain-style image reveal: the frame wipes open while the image settles from a slight zoom. */
export const ImageReveal = ({ src, alt = "", className = "", imgClassName = "", imgStyle, imgProps, delay = 0, from = "bottom", ...rest }) => {
  const clips = {
    bottom: "inset(100% 0% 0% 0%)",
    top: "inset(0% 0% 100% 0%)",
    left: "inset(0% 100% 0% 0%)",
    right: "inset(0% 0% 0% 100%)",
  };
  // The in-view trigger lives on an unclipped wrapper: browsers report a fully
  // clip-pathed element as not intersecting, so it would never reveal itself.
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      {...rest}
    >
      <motion.div
        className="w-full h-full overflow-hidden"
        variants={{
          hidden: { clipPath: clips[from] || clips.bottom },
          show: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 1.1, delay, ease: EASE } },
        }}
      >
        <motion.img
          src={src}
          alt={alt}
          className={imgClassName}
          style={imgStyle}
          {...imgProps}
          variants={{
            hidden: { scale: 1.25 },
            show: { scale: 1, transition: { duration: 1.6, delay, ease: EASE } },
          }}
        />
      </motion.div>
    </motion.div>
  );
};

/** Moves its children slower/faster than the scroll for a subtle depth effect. */
export const Parallax = ({ children, offset = 60, className = "", ...rest }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);
  return (
    <div ref={ref} className={className} {...rest}>
      <motion.div style={{ y }} className="w-full h-full">
        {children}
      </motion.div>
    </div>
  );
};

/** Thin gold reading-progress bar pinned to the top of the viewport. */
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-gradient-to-r from-brand-gold via-[#FFF3C4] to-brand-gold"
      style={{ scaleX, transformOrigin: "0% 50%" }}
      data-testid="scroll-progress"
    />
  );
};

/** Wraps the routed page so each navigation fades the new page in. */
export const PageTransition = ({ children, routeKey }) => (
  <motion.div
    key={routeKey}
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: EASE }}
  >
    {children}
  </motion.div>
);

/** Gentle infinite float, used for decorative icons and glows. */
export const Float = ({ children, y = 10, duration = 4, delay = 0, ...rest }) => (
  <motion.div
    animate={{ y: [0, -y, 0] }}
    transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    {...rest}
  >
    {children}
  </motion.div>
);

/** Standard hover / tap feel for cards. */
export const cardHover = { y: -8, transition: { duration: 0.35, ease: EASE } };
export const tap = { scale: 0.97 };
