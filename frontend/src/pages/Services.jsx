import React from "react";
import { Link } from "react-router-dom";
import { Divider, SectionLabel, SectionTitle } from "@/components/Divider";
import { GENTS_SERVICES, LADIES_SERVICES } from "@/lib/services";
import { Calendar, MessageCircle, MapPin, Clock, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Stagger, StaggerItem, ImageReveal, Parallax, EASE } from "@/components/Motion";

const Card = ({ s, i, kind }) => (
  <StaggerItem whileHover={{ y: -8, transition: { duration: 0.35, ease: EASE } }} whileTap={{ scale: 0.98 }} className="h-full">
    <Link
      to="/contact"
      data-testid={`svc-${kind}-${i}`}
      className="group block h-full bg-[#111111] border border-white/5 hover:border-brand-gold/50 transition-colors duration-300"
    >
      <div className="h-52 overflow-hidden relative">
        <img src={s.img} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent" />
      </div>
      <div className="p-5">
        <h3 className="font-playfair text-lg text-white mb-1 group-hover:text-brand-gold transition-colors">{s.name}</h3>
        <p className="text-white/50 text-xs">{s.desc}</p>
      </div>
    </Link>
  </StaggerItem>
);

/** Section heading whose gold rules draw outward from the title. */
const SplitHeading = ({ children }) => (
  <motion.div
    className="text-center mb-10"
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.6 }}
  >
    <div className="inline-flex items-center gap-4">
      <motion.div
        className="h-[1px] w-16 bg-brand-gold/50"
        style={{ transformOrigin: "100% 50%" }}
        variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.8, delay: 0.3, ease: EASE } } }}
      />
      <motion.h2
        className="font-playfair text-3xl text-white"
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
      >
        {children}
      </motion.h2>
      <motion.div
        className="h-[1px] w-16 bg-brand-gold/50"
        style={{ transformOrigin: "0% 50%" }}
        variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.8, delay: 0.3, ease: EASE } } }}
      />
    </div>
  </motion.div>
);

export default function Services() {
  return (
    <div data-testid="services-page">
      <section className="relative overflow-hidden pt-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 grid md:grid-cols-2 gap-8 items-center">
          <Stagger animateOnMount stagger={0.12} delay={0.1}>
            <StaggerItem><SectionLabel>Our Services</SectionLabel></StaggerItem>
            <StaggerItem as="h1" className="font-playfair text-5xl sm:text-6xl text-white leading-tight">
              EXPERT CARE<br /><span className="text-brand-gold italic">For Every Style</span>
            </StaggerItem>
            <StaggerItem><Divider className="!justify-start" /></StaggerItem>
            <StaggerItem as="p" className="text-white/60 mb-6 max-w-md">From classic cuts to advanced styling, we offer premium hair services for ladies &amp; gents.</StaggerItem>
            <StaggerItem className="flex flex-wrap gap-3">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link to="/contact" className="btn-gold"><Calendar className="w-4 h-4" /> Book Appointment</Link>
              </motion.div>
              <motion.a whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} href="https://wa.me/918878356060" target="_blank" rel="noreferrer" className="btn-outline-gold"><MessageCircle className="w-4 h-4" /> Book on WhatsApp</motion.a>
            </StaggerItem>
          </Stagger>
          <div className="hidden md:block relative aspect-[4/5] border border-brand-gold/30 overflow-hidden">
            <Parallax offset={40} className="absolute -inset-y-12 inset-x-0">
              <ImageReveal
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                alt="Services"
                from="right"
                delay={0.3}
                className="w-full h-full"
                imgClassName="w-full h-full object-cover"
              />
            </Parallax>
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-6 sm:px-8">
        <SplitHeading>Services for <span className="text-brand-gold italic">Gents</span></SplitHeading>
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-5" stagger={0.08} amount={0.05}>
          {GENTS_SERVICES.map((s, i) => <Card s={s} i={i} key={s.name} kind="gents" />)}
        </Stagger>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-6 sm:px-8">
        <SplitHeading>Services for <span className="text-brand-gold italic">Ladies</span></SplitHeading>
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-5" stagger={0.08} amount={0.05}>
          {LADIES_SERVICES.map((s, i) => <Card s={s} i={i} key={s.name} kind="ladies" />)}
        </Stagger>
      </section>

      <section className="py-10 bg-[#0A0A0A] border-y border-white/5">
        <Stagger className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center" stagger={0.12}>
          <StaggerItem className="flex items-center justify-center gap-3">
            <MapPin className="w-5 h-5 text-brand-gold" />
            <span className="text-white/80 text-sm">Bhopal, Madhya Pradesh</span>
          </StaggerItem>
          <StaggerItem className="flex items-center justify-center gap-3">
            <Clock className="w-5 h-5 text-brand-gold" />
            <span className="text-white/80 text-sm">Mon – Sun: 10:00 AM – 9:00 PM</span>
          </StaggerItem>
          <StaggerItem className="flex items-center justify-center gap-3">
            <Phone className="w-5 h-5 text-brand-gold" />
            <a href="tel:8878356060" className="text-white/80 text-sm hover:text-brand-gold">8878356060</a>
          </StaggerItem>
        </Stagger>
      </section>
    </div>
  );
}
