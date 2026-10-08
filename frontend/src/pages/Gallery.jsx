import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Divider, SectionLabel, SectionTitle } from "@/components/Divider";
import { Reveal, EASE } from "@/components/Motion";
import { GALLERY_IMAGES } from "@/lib/services";
import { X } from "lucide-react";

export default function Gallery() {
  const [open, setOpen] = useState(null);

  // Close the lightbox with Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div data-testid="gallery-page">
      <section className="py-16 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Our Work</SectionLabel>
          <SectionTitle>Hair <span className="text-brand-gold italic">Transformations</span></SectionTitle>
          <Divider />
          <Reveal as="p" delay={0.2} className="text-white/60 max-w-2xl mx-auto">A curated look at signature cuts, colour work, and bridal styling by our team.</Reveal>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {GALLERY_IMAGES.map((img, i) => (
            <motion.button
              key={i}
              onClick={() => setOpen(img)}
              className="relative aspect-square overflow-hidden group cursor-pointer border border-white/5 hover:border-brand-gold/40 transition-colors"
              data-testid={`gallery-item-${i}`}
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: (i % 4) * 0.08, ease: EASE }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              {/* Gold sheen on hover */}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.button>
          ))}
        </div>
      </section>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="lightbox"
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
              onClick={() => setOpen(null)}
              data-testid="lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                className="absolute top-6 right-6 text-white/70 hover:text-brand-gold"
                onClick={() => setOpen(null)}
                aria-label="Close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                whileHover={{ rotate: 90, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <X className="w-8 h-8" />
              </motion.button>
              <motion.img
                key={open}
                src={open}
                alt=""
                className="max-w-full max-h-full object-contain border border-brand-gold/40"
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
