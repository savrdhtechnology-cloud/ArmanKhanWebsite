import React from "react";
import { Link } from "react-router-dom";
import { Divider, SectionLabel, SectionTitle } from "@/components/Divider";
import { GENTS_SERVICES, LADIES_SERVICES } from "@/lib/services";
import { Calendar, MessageCircle, MapPin, Clock, Phone } from "lucide-react";

const Card = ({ s, i, kind }) => (
  <Link
    to="/contact"
    data-testid={`svc-${kind}-${i}`}
    className="group bg-[#111111] border border-white/5 hover:border-brand-gold/50 transition-all duration-300 hover:-translate-y-1"
  >
    <div className="h-52 overflow-hidden relative">
      <img src={s.img} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent" />
    </div>
    <div className="p-5">
      <h3 className="font-playfair text-lg text-white mb-1">{s.name}</h3>
      <p className="text-white/50 text-xs">{s.desc}</p>
    </div>
  </Link>
);

export default function Services() {
  return (
    <div data-testid="services-page">
      <section className="relative overflow-hidden pt-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <SectionLabel>Our Services</SectionLabel>
            <h1 className="font-playfair text-5xl sm:text-6xl text-white leading-tight">
              EXPERT CARE<br /><span className="text-brand-gold italic">For Every Style</span>
            </h1>
            <Divider className="!justify-start" />
            <p className="text-white/60 mb-6 max-w-md">From classic cuts to advanced styling, we offer premium hair services for ladies &amp; gents.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/contact" className="btn-gold"><Calendar className="w-4 h-4" /> Book Appointment</Link>
              <a href="https://wa.me/918878356060" target="_blank" rel="noreferrer" className="btn-outline-gold"><MessageCircle className="w-4 h-4" /> Book on WhatsApp</a>
            </div>
          </div>
          <div className="hidden md:block aspect-[4/5] border border-brand-gold/30 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" alt="Services" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4">
            <div className="h-[1px] w-16 bg-brand-gold/50" />
            <h2 className="font-playfair text-3xl text-white">Services for <span className="text-brand-gold italic">Gents</span></h2>
            <div className="h-[1px] w-16 bg-brand-gold/50" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {GENTS_SERVICES.map((s, i) => <Card s={s} i={i} key={s.name} kind="gents" />)}
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4">
            <div className="h-[1px] w-16 bg-brand-gold/50" />
            <h2 className="font-playfair text-3xl text-white">Services for <span className="text-brand-gold italic">Ladies</span></h2>
            <div className="h-[1px] w-16 bg-brand-gold/50" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {LADIES_SERVICES.map((s, i) => <Card s={s} i={i} key={s.name} kind="ladies" />)}
        </div>
      </section>

      <section className="py-10 bg-[#0A0A0A] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <MapPin className="w-5 h-5 text-brand-gold" />
            <span className="text-white/80 text-sm">Bhopal, Madhya Pradesh</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Clock className="w-5 h-5 text-brand-gold" />
            <span className="text-white/80 text-sm">Mon – Sun: 10:00 AM – 9:00 PM</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Phone className="w-5 h-5 text-brand-gold" />
            <a href="tel:8878356060" className="text-white/80 text-sm hover:text-brand-gold">8878356060</a>
          </div>
        </div>
      </section>
    </div>
  );
}
