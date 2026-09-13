import React from "react";
import { Divider, SectionLabel, SectionTitle } from "@/components/Divider";
import { Phone, Scissors, Sparkles, Award, ShieldCheck, MessageCircle, MapPin, Instagram, Facebook, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { SOCIALS } from "@/lib/socials";
import JourneyTimeline from "@/components/JourneyTimeline";

const VALUES = [
  { icon: Scissors, title: "Expert Stylists", desc: "Trained professionals with expertise in latest trends and techniques." },
  { icon: Sparkles, title: "Premium Products", desc: "We use high-quality, international brands for the best results." },
  { icon: Award, title: "Luxurious Experience", desc: "Hygienic, comfortable and modern environment for a relaxing visit." },
  { icon: ShieldCheck, title: "Customer Satisfaction", desc: "Your satisfaction is our top priority. We listen, we care, we deliver." },
];

const STATS = [
  { value: "10+", label: "Years Experience" },
  { value: "5000+", label: "Happy Clients" },
  { value: "16+", label: "Signature Services" },
  { value: "5★", label: "Google Rated" },
];

/** Decorative gold L-corner */
const Corner = ({ pos }) => {
  const map = {
    tl: "top-0 left-0 border-t-2 border-l-2",
    tr: "top-0 right-0 border-t-2 border-r-2",
    bl: "bottom-0 left-0 border-b-2 border-l-2",
    br: "bottom-0 right-0 border-b-2 border-r-2",
  };
  return <div className={`absolute ${map[pos]} border-brand-gold w-10 h-10 pointer-events-none`} />;
};

export default function About() {
  return (
    <div data-testid="about-page" className="bg-[#050505]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_40%,_rgba(201,169,97,0.06),_transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-24 grid md:grid-cols-12 gap-10 items-center relative">
          {/* Left content */}
          <div className="md:col-span-6 fade-up">
            <SectionLabel>About Us</SectionLabel>
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl text-white leading-[0.95] tracking-tight">
              ABOUT<br />
              <span className="text-brand-gold italic">Arman</span>
            </h1>
            <Divider className="!justify-start !my-6" />
            <p className="uppercase tracking-[0.3em] text-brand-gold text-xs mb-6">Passion · Precision · Perfection</p>
            <p className="text-white/70 leading-relaxed mb-4 max-w-lg">
              At Arman Hair Studio, we believe that a great haircut is more than just style — it's a
              reflection of your personality and confidence.
            </p>
            <p className="text-white/55 leading-relaxed mb-8 max-w-lg text-sm">
              From the moment you step in, our team crafts a personalised experience with international
              products, sharp precision techniques and a warm, luxurious ambience.
            </p>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {STATS.map((s) => (
                <div key={s.label} className="border-l-2 border-brand-gold/60 pl-3" data-testid={`stat-${s.label}`}>
                  <div className="font-playfair text-3xl text-white">{s.value}</div>
                  <div className="text-white/50 text-[10px] uppercase tracking-[0.2em] mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="tel:8878356060" className="btn-gold !py-3" data-testid="about-call">
                <Phone className="w-4 h-4" /> 8878356060
              </a>
              <a
                href="https://wa.me/918878356060"
                target="_blank"
                rel="noreferrer"
                className="btn-outline-gold !py-3"
                data-testid="about-whatsapp"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Right portrait with gold corner frame */}
          <div className="md:col-span-6 relative">
            <div className="relative aspect-[4/5] max-w-[520px] mx-auto p-4">
              <Corner pos="tl" />
              <Corner pos="tr" />
              <Corner pos="bl" />
              <Corner pos="br" />
              <div className="relative w-full h-full overflow-hidden bg-[#0A0A0A]">
                <img src="/assets/arman-portrait.jpg" alt="Arman Khan — Founder" className="w-full h-full object-cover object-top" data-testid="about-hero-photo" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/50 via-transparent to-transparent pointer-events-none" />
                {/* Floating founder card */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#050505]/85 backdrop-blur-sm border-l-2 border-brand-gold px-5 py-4">
                  <div className="font-signature text-brand-gold text-3xl leading-none">Arman Khan</div>
                  <div className="text-white/60 text-[10px] uppercase tracking-[0.3em] mt-1">Founder &amp; Master Hair Stylist</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="py-24 bg-[#0A0A0A] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid md:grid-cols-2 gap-14 items-center">
          <div className="relative aspect-[3/4] max-w-[480px] mx-auto p-3 order-2 md:order-1 w-full">
            <Corner pos="tl" />
            <Corner pos="br" />
            <div className="relative w-full h-full overflow-hidden bg-[#0A0A0A]">
              <img src="/assets/arman-portrait.jpg" alt="Arman Khan" className="w-full h-full object-cover" style={{ objectPosition: "50% 20%" }} data-testid="about-story-photo" />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <SectionLabel>Our Story</SectionLabel>
            <SectionTitle>Crafting Confidence<br /><span className="text-brand-gold italic">Since Day One</span></SectionTitle>
            <Divider className="!justify-start" />
            <p className="text-white/70 leading-relaxed mb-4">
              Founded by Arman Khan, Arman Hair Studio is a premium unisex salon in Bhopal dedicated
              to delivering world-class hair services with a personal touch.
            </p>
            <p className="text-white/70 leading-relaxed mb-6">
              With years of experience and a deep understanding of hair trends, we combine creativity
              with precision to give you a look that's uniquely you. Every client leaves feeling
              transformed — inside and out.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <div className="font-signature text-brand-gold text-5xl leading-none">Arman Khan</div>
              <div className="h-10 w-px bg-brand-gold/40" />
              <div>
                <div className="text-white text-sm">Founder</div>
                <div className="text-white/40 text-xs uppercase tracking-[0.25em]">Hair Expert</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JourneyTimeline />

      {/* VALUES */}
      <section className="py-24 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-14">
          <SectionLabel>Our Values</SectionLabel>
          <SectionTitle>What Makes Us <span className="text-brand-gold italic">Different</span></SectionTitle>
          <Divider />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((v, i) => (
            <div key={i} className="relative bg-[#111111] border border-white/5 p-8 text-center hover:border-brand-gold/50 transition-all duration-500 hover:-translate-y-1 group overflow-hidden" data-testid={`value-${i}`}>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-gold/[0.04] rounded-full blur-xl group-hover:bg-brand-gold/10 transition-all" />
              <v.icon className="w-10 h-10 text-brand-gold mx-auto mb-4 relative" strokeWidth={1.2} />
              <h3 className="font-playfair text-lg text-white mb-2 relative">{v.title}</h3>
              <p className="text-white/50 text-sm relative">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Studio location strip */}
      <section className="py-10 bg-[#0A0A0A] border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3 text-white/80">
            <MapPin className="w-5 h-5 text-brand-gold" />
            <span className="text-sm">Bhopal, Madhya Pradesh · India 462001</span>
          </div>
          <Link to="/contact" className="btn-gold !py-3 !px-6 !text-xs">Book Your Chair</Link>
        </div>
      </section>

      {/* FOLLOW US - Social */}
      <section className="py-24 relative overflow-hidden" data-testid="follow-us-section">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,169,97,0.06),_transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 sm:px-8 relative text-center">
          <SectionLabel>Follow Us</SectionLabel>
          <SectionTitle>Stay Connected <span className="text-brand-gold italic">&amp; Inspired</span></SectionTitle>
          <Divider />
          <p className="text-white/60 max-w-xl mx-auto mb-12">Follow our journey — signature transformations, behind-the-scenes reels and studio updates every week.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Instagram */}
            <a
              href={SOCIALS.instagram}
              target="_blank"
              rel="noreferrer"
              className="group bg-[#111111] border border-white/5 hover:border-brand-gold/60 p-8 flex flex-col items-center transition-all duration-500 hover:-translate-y-1"
              data-testid="social-instagram"
            >
              <div className="w-16 h-16 border border-brand-gold flex items-center justify-center mb-4 group-hover:bg-brand-gold transition-colors">
                <Instagram className="w-7 h-7 text-brand-gold group-hover:text-[#050505] transition-colors" strokeWidth={1.4} />
              </div>
              <div className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-2">Instagram</div>
              <div className="font-playfair text-xl text-white mb-1">{SOCIALS.instagramHandle}</div>
              <div className="text-white/40 text-xs">Daily reels &amp; hair looks</div>
              <div className="mt-5 text-brand-gold text-[11px] uppercase tracking-widest border-b border-brand-gold/40 pb-1 group-hover:border-brand-gold">Follow ›</div>
            </a>

            {/* Facebook */}
            <a
              href={SOCIALS.facebook}
              target="_blank"
              rel="noreferrer"
              className="group bg-[#111111] border border-white/5 hover:border-brand-gold/60 p-8 flex flex-col items-center transition-all duration-500 hover:-translate-y-1"
              data-testid="social-facebook"
            >
              <div className="w-16 h-16 border border-brand-gold flex items-center justify-center mb-4 group-hover:bg-brand-gold transition-colors">
                <Facebook className="w-7 h-7 text-brand-gold group-hover:text-[#050505] transition-colors" strokeWidth={1.4} />
              </div>
              <div className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-2">Facebook</div>
              <div className="font-playfair text-xl text-white mb-1">Arman Hair Studio</div>
              <div className="text-white/40 text-xs">Reviews &amp; announcements</div>
              <div className="mt-5 text-brand-gold text-[11px] uppercase tracking-widest border-b border-brand-gold/40 pb-1 group-hover:border-brand-gold">Like ›</div>
            </a>

            {/* YouTube */}
            <a
              href={SOCIALS.youtube}
              target="_blank"
              rel="noreferrer"
              className="group bg-[#111111] border border-white/5 hover:border-brand-gold/60 p-8 flex flex-col items-center transition-all duration-500 hover:-translate-y-1"
              data-testid="social-youtube"
            >
              <div className="w-16 h-16 border border-brand-gold flex items-center justify-center mb-4 group-hover:bg-brand-gold transition-colors">
                <Youtube className="w-7 h-7 text-brand-gold group-hover:text-[#050505] transition-colors" strokeWidth={1.4} />
              </div>
              <div className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-2">YouTube</div>
              <div className="font-playfair text-xl text-white mb-1">{SOCIALS.youtubeHandle}</div>
              <div className="text-white/40 text-xs">Tutorials &amp; studio tours</div>
              <div className="mt-5 text-brand-gold text-[11px] uppercase tracking-widest border-b border-brand-gold/40 pb-1 group-hover:border-brand-gold">Subscribe ›</div>
            </a>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 text-center px-6 max-w-3xl mx-auto">
        <SectionLabel>Experience</SectionLabel>
        <SectionTitle>Ready to <span className="text-brand-gold italic">Transform</span> Your Look?</SectionTitle>
        <Divider />
        <p className="text-white/60 mb-8">Reserve your chair and step into a world of luxury grooming.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/contact" className="btn-gold" data-testid="about-cta-book">Book Your Appointment</Link>
          <Link to="/services" className="btn-outline-gold" data-testid="about-cta-services">Explore Services</Link>
        </div>
      </section>
    </div>
  );
}
