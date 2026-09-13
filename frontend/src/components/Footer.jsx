import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Phone, MessageCircle } from "lucide-react";
import { SOCIALS } from "@/lib/socials";

const SOCIAL_ITEMS = [
  { icon: Instagram, href: SOCIALS.instagram, label: "Instagram" },
  { icon: Facebook, href: SOCIALS.facebook, label: "Facebook" },
  { icon: Youtube, href: SOCIALS.youtube, label: "YouTube" },
];

export const Footer = () => (
  <footer className="bg-[#0A0A0A] border-t border-white/5 mt-24" data-testid="footer">
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
      <div>
        <img src="/assets/arman-logo.png" alt="Arman Hair Studio" className="h-16 w-auto mb-4" />
        <p className="text-white/50 text-sm leading-relaxed">Luxury Hair &amp; Grooming for Ladies &amp; Gents in Bhopal.</p>
      </div>

      <div>
        <h4 className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-4">Quick Links</h4>
        <ul className="space-y-2 text-white/60 text-sm">
          <li><Link to="/" className="hover:text-brand-gold">Home</Link></li>
          <li><Link to="/about" className="hover:text-brand-gold">About</Link></li>
          <li><Link to="/services" className="hover:text-brand-gold">Services</Link></li>
          <li><Link to="/gallery" className="hover:text-brand-gold">Gallery</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-4">Visit</h4>
        <ul className="space-y-2 text-white/60 text-sm">
          <li>Bhopal, Madhya Pradesh</li>
          <li>India – 462001</li>
          <li>Mon – Sun: 10 AM – 9 PM</li>
        </ul>
      </div>

      <div>
        <h4 className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-4">Connect</h4>
        <div className="flex gap-3 mb-4">
          {SOCIAL_ITEMS.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 border border-brand-gold/40 flex items-center justify-center text-brand-gold hover:bg-brand-gold hover:text-black transition-colors"
              aria-label={label}
              data-testid={`social-footer-${label.toLowerCase()}`}
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
        <a href={`tel:${SOCIALS.phone}`} className="flex items-center gap-2 text-white/70 text-sm hover:text-brand-gold"><Phone className="w-4 h-4" /> {SOCIALS.phone}</a>
        <a href={SOCIALS.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/70 text-sm hover:text-brand-gold mt-1"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
      </div>
    </div>
    <div className="border-t border-white/5 py-6 text-center text-white/40 text-xs">
      © 2026 Arman Hair Studio. All Rights Reserved. · Owner: Arman Khan
    </div>
  </footer>
);
