import React from "react";
import { Link } from "react-router-dom";
import { Calendar, MessageCircle, Scissors, Award, Sparkles, ShieldCheck, Star, MapPin, Instagram, ClipboardList, Clock, CheckCircle2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Divider, SectionLabel, SectionTitle } from "@/components/Divider";
import { CountUp, SplitReveal, Shimmer, Marquee } from "@/components/Animated";
import { GENTS_SERVICES, GALLERY_IMAGES } from "@/lib/services";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const FEATURED = GENTS_SERVICES.slice(0, 4);

const FEATURES = [
  { icon: Scissors, title: "Expert Stylists", sub: "Trained professionals" },
  { icon: Sparkles, title: "Premium Products", sub: "International brands" },
  { icon: ShieldCheck, title: "Hygienic Environment", sub: "Clean & modern" },
  { icon: Award, title: "Customer Satisfaction", sub: "Loved by clients" },
];

const JOURNEY = [
  { num: "01", icon: ClipboardList, title: "Choose Your Service", desc: "Browse our Ladies & Gents menu and pick your signature service." },
  { num: "02", icon: Clock, title: "Pick Date & Time", desc: "Select a slot that fits your day. We work Mon – Sun · 10 AM – 9 PM." },
  { num: "03", icon: CheckCircle2, title: "Confirm Details", desc: "Share your name, phone & email. Add a note if you have a special request." },
  { num: "04", icon: Mail, title: "Get Confirmation", desc: "Instant email confirmation. Arman's team calls to finalise your slot." },
];

export default function Home() {
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews-home"],
    queryFn: async () => (await api.get("/reviews")).data,
  });

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#050505]">
        {/* Portrait */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-y-0 right-0 w-full md:w-[62%] h-full">
            <img
              src="/assets/arman-portrait.jpg"
              alt="Arman Khan"
              className="w-full h-full object-cover"
              style={{ objectPosition: "35% 15%" }}
            />
            {/* Left→right fade blending into black */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent" />
            {/* Bottom vignette only */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#050505] to-transparent" />
          </div>
          {/* Warm gold glow behind subject */}
          <div className="absolute right-[15%] top-1/4 w-[35%] h-[55%] bg-brand-gold/[0.08] blur-[100px] rounded-full" />
          <div className="hero-glow" />
        </div>

        {/* Decorative gold vertical accent bars */}
        <div className="hidden md:block absolute left-[52%] top-24 bottom-24 w-px bg-gradient-to-b from-transparent via-brand-gold/30 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 pt-16 md:pt-24 pb-20 grid md:grid-cols-2 gap-8 items-center min-h-[calc(100vh-5rem)]">
          <div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}>
              <SectionLabel>Premium Hair Experience</SectionLabel>
            </motion.div>
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl text-white leading-[0.95] tracking-tight overflow-hidden">
              <SplitReveal text="ARMAN" delay={0.2} />
              <br />
              <SplitReveal text="Hair Studio" className="text-brand-gold italic" delay={0.55} />
            </h1>
            <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 1.15, duration: 0.7 }} style={{ transformOrigin: "left" }}>
              <Divider className="!my-6 !justify-start" />
            </motion.div>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3, duration: 0.6 }} className="font-playfair italic text-2xl mb-2">
              <Shimmer>The Art of Hair</Shimmer>
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-brand-gold tracking-[0.35em] text-[10px] uppercase mb-4">Luxury Hair &amp; Grooming</motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="text-white/70 tracking-[0.2em] text-xs uppercase mb-4">Ladies &amp; Gents Hair Specialist</motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }} className="flex items-center gap-2 text-white/70 mb-8">
              <MapPin className="w-4 h-4 text-brand-gold" />
              <span className="text-sm">Bhopal, Madhya Pradesh</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.6 }} className="flex flex-wrap gap-4">
              <Link to="/contact" className="btn-gold group" data-testid="hero-book-btn">
                <Calendar className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Book Your Chair
              </Link>
              <a
                href="https://wa.me/918878356060?text=Hi%20Arman%20Hair%20Studio%2C%20I%20want%20to%20book%20an%20appointment."
                target="_blank"
                rel="noreferrer"
                className="btn-outline-gold group"
                data-testid="hero-whatsapp-btn"
              >
                <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" /> Book on WhatsApp
              </a>
            </motion.div>
          </div>

          {/* Right-side name plate overlay on portrait */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4, duration: 0.7 }}
            className="hidden md:block relative"
          >
            <div className="absolute -bottom-6 right-0 bg-[#050505]/80 backdrop-blur-sm border-l-2 border-brand-gold px-6 py-4 max-w-[280px]">
              <div className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-1">Founder</div>
              <div className="font-playfair text-2xl text-white">Arman Khan</div>
              <div className="text-white/50 text-xs mt-1">Master Hair Stylist</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee ticker */}
      <section className="border-y border-brand-gold/20 bg-[#050505] py-6 overflow-hidden" data-testid="hero-marquee">
        <Marquee items={["THE ART OF HAIR", "PREMIUM STYLING", "LUXURY GROOMING", "SIGNATURE CUTS", "BHOPAL"]} />
      </section>

      {/* Feature strip with pulse-in icons */}
      <section className="border-y border-white/5 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex items-center gap-3"
              data-testid={`feature-${i}`}
            >
              <motion.div
                className="w-11 h-11 border border-brand-gold/40 flex items-center justify-center"
                whileHover={{ rotate: 12, borderColor: "#C9A961" }}
              >
                <f.icon className="w-5 h-5 text-brand-gold" strokeWidth={1.5} />
              </motion.div>
              <div>
                <div className="text-white/50 text-[10px] uppercase tracking-widest">{f.title.split(" ")[0]}</div>
                <div className="text-white font-manrope text-sm">{f.title.split(" ").slice(1).join(" ") || f.title}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Animated stats strip */}
      <section className="py-14 bg-[#050505] border-b border-white/5" data-testid="stats-strip">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: 10, s: "+", label: "Years Experience" },
            { n: 5000, s: "+", label: "Happy Clients" },
            { n: 16, s: "+", label: "Signature Services" },
            { n: 5, s: "★", label: "Google Rated" },
          ].map((st, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border-l-2 border-brand-gold/60 pl-4 text-left"
            >
              <div className="font-playfair text-4xl md:text-5xl text-white">
                <CountUp end={st.n} className="text-white" /><span className="text-brand-gold">{st.s}</span>
              </div>
              <div className="text-white/50 text-[10px] uppercase tracking-[0.25em] mt-2">{st.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Booking Journey - Animated */}
      <section className="relative py-24 overflow-hidden" data-testid="booking-journey">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,169,97,0.06),_transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative">
          <div className="text-center mb-16">
            <SectionLabel>How It Works</SectionLabel>
            <SectionTitle>Your Booking <span className="text-brand-gold italic">Journey</span></SectionTitle>
            <Divider />
            <p className="text-white/60 max-w-xl mx-auto">Four elegant steps from browsing our chair to sitting in it.</p>
          </div>

          {/* Desktop timeline */}
          <div className="relative">
            {/* Dotted connecting line */}
            <div className="hidden lg:block absolute top-[70px] left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(201,169,97,0.5) 0 6px, transparent 6px 14px)" }} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
              {JOURNEY.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: i * 0.18, ease: "easeOut" }}
                  className="relative text-center group"
                  data-testid={`journey-step-${i + 1}`}
                >
                  {/* Icon circle */}
                  <div className="relative mx-auto w-[110px] h-[110px] mb-6">
                    <motion.div
                      className="absolute inset-0 rounded-full border border-brand-gold/40"
                      animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.15, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                    />
                    <div className="absolute inset-2 rounded-full border border-brand-gold/60 bg-[#0A0A0A] flex items-center justify-center transition-all duration-500 group-hover:bg-brand-gold group-hover:border-brand-gold">
                      <step.icon className="w-9 h-9 text-brand-gold transition-colors duration-500 group-hover:text-[#050505]" strokeWidth={1.3} />
                    </div>
                    {/* Number badge */}
                    <div className="absolute -top-2 -right-2 w-9 h-9 bg-brand-gold text-[#050505] font-playfair text-sm flex items-center justify-center font-bold border-4 border-[#050505]">
                      {step.num}
                    </div>
                  </div>

                  <h3 className="font-playfair text-xl text-white mb-2">{step.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed px-2">{step.desc}</p>

                  {/* Mobile connector arrow */}
                  {i < JOURNEY.length - 1 && (
                    <div className="lg:hidden flex justify-center mt-6 mb-[-1rem] text-brand-gold/40">
                      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                        <path d="M10 0 V22 M4 16 L10 22 L16 16" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="text-center mt-16"
          >
            <Link to="/contact" className="btn-gold" data-testid="journey-cta">
              <Calendar className="w-4 h-4" /> Start Your Booking
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 max-w-7xl mx-auto px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <SectionLabel>Our Services</SectionLabel>
          <SectionTitle>Services We Offer</SectionTitle>
          <Divider />
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
              data-testid={`featured-service-${i}`}
            >
              <Link
                to="/services"
                className="group block bg-[#111111] border border-white/5 hover:border-brand-gold/50 transition-all duration-500 h-full"
              >
                <div className="h-56 overflow-hidden relative">
                  <img src={s.img} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-6">
                  <div className="text-brand-gold text-[10px] uppercase tracking-[0.25em] mb-2">Signature</div>
                  <h3 className="font-playfair text-xl text-white mb-2 group-hover:text-brand-gold transition-colors">{s.name}</h3>
                  <p className="text-white/50 text-sm mb-4">{s.desc}</p>
                  <span className="text-brand-gold text-xs uppercase tracking-widest border-b border-brand-gold/40 pb-1 group-hover:border-brand-gold transition-colors">Enquire ›</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link to="/services" className="btn-outline-gold" data-testid="view-all-services">View All Services</Link>
        </motion.div>
      </section>

      {/* Why choose */}
      <section className="py-24 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <SectionLabel>Why Choose Us</SectionLabel>
            <SectionTitle>A Luxury <span className="text-brand-gold italic">Experience</span></SectionTitle>
            <Divider className="!justify-start" />
            <p className="text-white/60 leading-relaxed mb-6">
              At Arman Hair Studio, every visit is designed to feel effortless and elevated. From precision cuts
              to advanced hair care, we combine international techniques with a warm personal touch.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {FEATURES.map((f, i) => (
                <div key={i} className="border-l-2 border-brand-gold/60 pl-4">
                  <f.icon className="w-6 h-6 text-brand-gold mb-2" strokeWidth={1.2} />
                  <div className="text-white font-playfair text-lg">{f.title}</div>
                  <div className="text-white/50 text-sm">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden border border-brand-gold/30">
            <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?crop=entropy&cs=srgb&fm=jpg&q=85&w=900" alt="Studio" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Reviews preview */}
      <section className="py-24 max-w-7xl mx-auto px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <SectionLabel>Testimonials</SectionLabel>
          <SectionTitle>What Clients Say</SectionTitle>
          <Divider />
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 30, rotateX: -8 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ y: -6, borderColor: "#C9A961" }}
              className="bg-[#111111] border border-white/5 p-8 transition-colors"
              data-testid={`review-${r.id}`}
            >
              <div className="flex gap-1 mb-4 text-brand-gold">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <Star className="w-4 h-4 fill-brand-gold" />
                  </motion.span>
                ))}
              </div>
              <p className="text-white/70 italic mb-6 font-playfair">"{r.comment}"</p>
              <div className="text-brand-gold text-xs uppercase tracking-[0.25em]">— {r.name}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Instagram gallery */}
      <section className="py-24 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <SectionLabel>Follow Us</SectionLabel>
            <SectionTitle>Instagram Gallery</SectionTitle>
            <Divider />
            <a href="https://www.instagram.com/arman_hair_hk/" target="_blank" rel="noreferrer" className="text-brand-gold text-sm inline-flex items-center gap-2 hover:underline">
              <Instagram className="w-4 h-4" /> @arman_hair_hk
            </a>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {GALLERY_IMAGES.slice(0, 6).map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
                className="aspect-square overflow-hidden group cursor-pointer"
                data-testid={`insta-${i}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 max-w-4xl mx-auto text-center px-6">
        <SectionLabel>Ready?</SectionLabel>
        <SectionTitle>Reserve Your <span className="text-brand-gold italic">Chair</span></SectionTitle>
        <Divider />
        <p className="text-white/60 mb-8">Walk-ins welcome. For guaranteed slots, book in advance.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/contact" className="btn-gold" data-testid="cta-book"><Calendar className="w-4 h-4" /> Book Appointment</Link>
          <a href="tel:8878356060" className="btn-outline-gold" data-testid="cta-call">Call 8878356060</a>
        </div>
      </section>
    </div>
  );
}
