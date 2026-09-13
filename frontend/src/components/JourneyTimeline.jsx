import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Scissors, Dumbbell, Building2, Sparkles, Quote, Award, Briefcase, Crown } from "lucide-react";
import { Divider, SectionLabel, SectionTitle } from "@/components/Divider";
import { CountUp } from "@/components/Animated";

const MILESTONES = [
  {
    year: "2008",
    icon: Scissors,
    title: "ARMAN HAIR STUDIO",
    subtitle: "Founded",
    tag: "Premium Hair Styling & Grooming Journey",
    body: "Started the journey in the hair & grooming industry with a vision to create premium styling experiences.",
    highlights: [
      "Luxury hair styling",
      "Client grooming experience",
      "Modern styling techniques",
      "Premium salon standards",
      "Personalized customer experience",
    ],
  },
  {
    year: "2021",
    icon: Scissors,
    title: "7 STYLES SALON",
    subtitle: "Signature Collaboration",
    tag: "Salon · Spa · Makeup",
    body: "Professional Hair Styling & Grooming Experience — worked with a premium salon environment focused on world-class client experience.",
    highlights: [
      "Luxury hair styling",
      "Client grooming experience",
      "Premium salon standards",
      "Modern styling techniques",
    ],
  },
  {
    year: "2021",
    icon: Dumbbell,
    title: "FITBLISS",
    subtitle: "Brand Collaboration",
    tag: "Luxury Fitness Center",
    body: "Brand Experience & Creative Collaboration — associated with a luxury fitness brand representing elevated lifestyle.",
    highlights: [
      "Premium brand presentation",
      "Client-focused service approach",
      "Professional grooming & lifestyle aesthetics",
      "Modern luxury standards",
    ],
  },
  {
    year: "2024",
    icon: Building2,
    title: "SAVRDH FINANCIAL SERVICES PRIVATE LIMITED",
    subtitle: "Director · Savrdh Group",
    tag: "Greater Noida, Uttar Pradesh",
    body: "Professional financial advisory and business consulting firm delivering MSME funding support, project finance advisory, and strategic business solutions.",
    highlights: [
      "MSME funding advisory",
      "Project finance solutions",
      "Strategic business consulting",
      "Entrepreneurial leadership",
    ],
  },
];

const COUNTERS = [
  { icon: Award, value: 15, suffix: "+", label: "Years Experience" },
  { icon: Sparkles, value: null, text: "Premium", label: "Hair Artist" },
  { icon: Briefcase, value: null, text: "Founder", label: "Entrepreneur" },
  { icon: Crown, value: null, text: "Luxury", label: "Service Specialist" },
];

function MilestoneCard({ item, index, isLeft }) {
  const Icon = item.icon;
  return (
    <div className="relative grid md:grid-cols-9 items-start gap-4 mb-16 md:mb-24">
      {/* Left side content (desktop only when isLeft) */}
      <div className={`hidden md:block md:col-span-4 ${isLeft ? "" : "md:invisible"}`}>
        {isLeft && <Content item={item} index={index} dir="right" />}
      </div>

      {/* Center rail with year badge */}
      <div className="md:col-span-1 flex md:flex-col items-center md:items-center relative z-10 gap-4 md:gap-0">
        {/* Year badge - pulses gold */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="relative"
        >
          {/* pulsing gold ring */}
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-brand-gold"
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: index * 0.3 }}
          />
          <div className="relative w-20 h-20 md:w-24 md:h-24 bg-[#050505] border-2 border-brand-gold rounded-full flex flex-col items-center justify-center">
            <Icon className="w-5 h-5 text-brand-gold mb-0.5" strokeWidth={1.4} />
            <div className="font-playfair text-lg md:text-xl text-brand-gold leading-none">{item.year}</div>
          </div>
        </motion.div>

        {/* Mobile content below badge */}
        <div className="md:hidden flex-1">
          <Content item={item} index={index} dir="right" />
        </div>
      </div>

      {/* Right side content (desktop only when !isLeft) */}
      <div className={`hidden md:block md:col-span-4 ${!isLeft ? "" : "md:invisible"}`}>
        {!isLeft && <Content item={item} index={index} dir="left" />}
      </div>
    </div>
  );
}

function Content({ item, index, dir }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: dir === "left" ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-[#111111] border border-white/5 hover:border-brand-gold/60 p-6 md:p-8 group transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.4)]"
      data-testid={`milestone-${index}`}
    >
      {/* Gold arrow pointer to rail (desktop) */}
      <div className={`hidden md:block absolute top-8 w-4 h-4 bg-[#111111] border-t border-r border-white/5 rotate-45 group-hover:border-brand-gold/60 transition-colors ${dir === "left" ? "-right-2" : "-left-2 rotate-[225deg]"}`} />

      {/* Subtle gold glow on hover */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-brand-gold/[0.04] rounded-full blur-2xl group-hover:bg-brand-gold/10 transition-all duration-700 pointer-events-none" />

      <div className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-2">{item.subtitle}</div>
      <h3 className="font-playfair text-xl md:text-2xl text-white mb-2 group-hover:text-brand-gold transition-colors">{item.title}</h3>
      <div className="text-white/45 text-xs italic mb-4">{item.tag}</div>

      <p className="text-white/65 text-sm leading-relaxed mb-5">{item.body}</p>

      <div className="border-t border-white/5 pt-4">
        <div className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-3">Highlights</div>
        <ul className="space-y-2">
          {item.highlights.map((h, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: dir === "left" ? -10 : 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-3 text-white/75 text-sm"
            >
              <span className="w-1.5 h-1.5 bg-brand-gold flex-shrink-0" />
              {h}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function JourneyTimeline() {
  const railRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 80%", "end 20%"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="relative py-24 overflow-hidden" data-testid="journey-timeline-section">
      {/* Background ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_10%,_rgba(201,169,97,0.08),_transparent_60%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 sm:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <SectionLabel>Achievements</SectionLabel>
          <SectionTitle>Achievements <br /><span className="text-brand-gold italic">&amp; Professional Journey</span></SectionTitle>
          <Divider />
          <p className="text-white/60 max-w-xl mx-auto">A decade of craft, collaboration and continuous evolution — from the chair to the boardroom.</p>
        </motion.div>

        {/* Timeline rail */}
        <div ref={railRef} className="relative">
          {/* Faint full rail (desktop centered, mobile left) */}
          <div className="absolute md:left-1/2 left-10 md:-translate-x-1/2 top-0 bottom-0 w-px bg-white/10" />
          {/* Animated gold rail growing with scroll */}
          <motion.div
            style={{ height: lineHeight }}
            className="absolute md:left-1/2 left-10 md:-translate-x-1/2 top-0 w-px bg-gradient-to-b from-brand-gold via-brand-gold to-brand-gold/40 shadow-[0_0_10px_rgba(201,169,97,0.6)]"
          />

          {MILESTONES.map((m, i) => (
            <MilestoneCard key={i} item={m} index={i} isLeft={i % 2 === 0} />
          ))}
        </div>

        {/* Founder Journey Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mt-8 max-w-4xl mx-auto text-center bg-[#0A0A0A] border border-brand-gold/30 p-10 md:p-14"
          data-testid="founder-journey-quote"
        >
          <Quote className="w-10 h-10 text-brand-gold/70 mx-auto mb-4" strokeWidth={1.2} />
          <div className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-3">Founder Journey</div>
          <p className="font-playfair italic text-xl md:text-2xl text-white/85 leading-relaxed mb-4">
            "From Hair Artistry to Entrepreneurship — a journey built on passion, creativity, leadership and dedication."
          </p>
          <div className="font-signature text-brand-gold text-4xl mt-6">Arman Khan</div>
        </motion.div>

        {/* Animated counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16" data-testid="journey-counters">
          {COUNTERS.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -6, borderColor: "#C9A961" }}
              className="bg-[#111111] border border-white/5 p-6 text-center transition-colors relative overflow-hidden"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-brand-gold/[0.05] rounded-full blur-2xl" />
              <c.icon className="w-6 h-6 text-brand-gold mx-auto mb-3 relative" strokeWidth={1.3} />
              {c.value !== null ? (
                <div className="font-playfair text-4xl text-white relative">
                  <CountUp end={c.value} /><span className="text-brand-gold">{c.suffix}</span>
                </div>
              ) : (
                <div className="font-playfair text-2xl md:text-3xl text-brand-gold relative">{c.text}</div>
              )}
              <div className="text-white/50 text-[10px] uppercase tracking-[0.25em] mt-2 relative">{c.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
