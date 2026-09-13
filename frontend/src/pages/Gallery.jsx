import React, { useState } from "react";
import { Divider, SectionLabel, SectionTitle } from "@/components/Divider";
import { GALLERY_IMAGES } from "@/lib/services";
import { X } from "lucide-react";

export default function Gallery() {
  const [open, setOpen] = useState(null);
  return (
    <div data-testid="gallery-page">
      <section className="py-16 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Our Work</SectionLabel>
          <SectionTitle>Hair <span className="text-brand-gold italic">Transformations</span></SectionTitle>
          <Divider />
          <p className="text-white/60 max-w-2xl mx-auto">A curated look at signature cuts, colour work, and bridal styling by our team.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {GALLERY_IMAGES.map((img, i) => (
            <button
              key={i}
              onClick={() => setOpen(img)}
              className="aspect-square overflow-hidden group cursor-pointer border border-white/5 hover:border-brand-gold/40 transition-all"
              data-testid={`gallery-item-${i}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </button>
          ))}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setOpen(null)} data-testid="lightbox">
          <button className="absolute top-6 right-6 text-white/70 hover:text-brand-gold" onClick={() => setOpen(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={open} alt="" className="max-w-full max-h-full object-contain border border-brand-gold/40" />
        </div>
      )}
    </div>
  );
}
