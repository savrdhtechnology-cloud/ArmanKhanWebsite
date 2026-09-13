import React, { useState } from "react";
import { Divider, SectionLabel, SectionTitle } from "@/components/Divider";
import { Phone, MessageCircle, MapPin, Clock, Instagram, Calendar, ShieldCheck } from "lucide-react";
import { ALL_SERVICE_NAMES } from "@/lib/services";
import { api, formatError } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function Contact() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    service: "",
    date: "",
    time: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email || !form.service || !form.date || !form.time) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await api.post("/appointments", form);
      toast.success("Booking received! We'll confirm shortly.");
      setForm({ ...form, service: "", date: "", time: "", message: "" });
    } catch (e) {
      toast.error(formatError(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div data-testid="contact-page">
      <section className="pt-8 pb-4 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="mb-8">
          <SectionLabel>Get in touch</SectionLabel>
          <h1 className="font-playfair text-5xl sm:text-6xl text-white leading-tight">
            Contact &amp;<br /><span className="text-brand-gold italic">Appointment</span>
          </h1>
          <Divider className="!justify-start" />
          <p className="text-white/60 max-w-xl">We're here to make you look and feel your best. Have a question or ready for a fresh look? Get in touch or book your appointment in advance.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 sm:px-8 grid md:grid-cols-2 gap-10 pb-16">
        {/* Contact info */}
        <div className="space-y-5">
          <h3 className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-2">Get in Touch</h3>
          {[
            { icon: Phone, label: "Call Us", value: "8878356060", href: "tel:8878356060" },
            { icon: MessageCircle, label: "WhatsApp", value: "8878356060", href: "https://wa.me/918878356060" },
            { icon: MapPin, label: "Visit Us", value: "Bhopal, Madhya Pradesh, India – 462001" },
            { icon: Clock, label: "Studio Hours", value: "Mon – Sun · 10:00 AM – 9:00 PM" },
            { icon: Instagram, label: "Follow Us", value: "@arman_hair_hk", href: "https://www.instagram.com/arman_hair_hk/" },
          ].map((c, i) => (
            <div key={i} className="flex items-start gap-4 bg-[#111111] border border-white/5 p-5" data-testid={`contact-${i}`}>
              <div className="w-11 h-11 border border-brand-gold/40 flex items-center justify-center flex-shrink-0">
                <c.icon className="w-4 h-4 text-brand-gold" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-1">{c.label}</div>
                {c.href ? <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-white hover:text-brand-gold">{c.value}</a> : <div className="text-white">{c.value}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Booking form */}
        <form onSubmit={submit} className="bg-[#111111] border border-brand-gold/30 p-8" data-testid="booking-form">
          <h3 className="font-playfair text-2xl text-white mb-2 flex items-center gap-2"><Calendar className="w-5 h-5 text-brand-gold" /> Book an Appointment</h3>
          <div className="h-[1px] w-16 bg-brand-gold/50 mb-6" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input className="luxury-input" placeholder="Your Name *" value={form.name} onChange={set("name")} data-testid="input-name" />
            <input className="luxury-input" placeholder="Mobile Number *" value={form.phone} onChange={set("phone")} data-testid="input-phone" />
          </div>
          <input className="luxury-input mb-4" placeholder="Email Address *" type="email" value={form.email} onChange={set("email")} data-testid="input-email" />

          <select className="luxury-input mb-4" value={form.service} onChange={set("service")} data-testid="input-service">
            <option value="" className="bg-[#111]">Select Service *</option>
            {ALL_SERVICE_NAMES.map((n) => <option key={n} value={n} className="bg-[#111]">{n}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <input className="luxury-input" type="date" value={form.date} onChange={set("date")} min={new Date().toISOString().split("T")[0]} data-testid="input-date" />
            <input className="luxury-input" type="time" value={form.time} onChange={set("time")} data-testid="input-time" />
          </div>
          <textarea className="luxury-input min-h-[90px] mb-6" placeholder="Additional Message (Optional)" value={form.message} onChange={set("message")} data-testid="input-message" />

          <button type="submit" className="btn-gold w-full mb-4" disabled={loading} data-testid="submit-booking">
            <Calendar className="w-4 h-4" /> {loading ? "Sending..." : "Book Appointment"}
          </button>

          <div className="relative py-2 text-center text-white/40 text-xs">
            <div className="absolute inset-y-1/2 left-0 h-[1px] w-1/3 bg-white/10" />
            <div className="absolute inset-y-1/2 right-0 h-[1px] w-1/3 bg-white/10" />
            <span>OR</span>
          </div>

          <a href="https://wa.me/918878356060?text=Hi%20Arman%20Hair%20Studio%2C%20I%20want%20to%20book%20an%20appointment." target="_blank" rel="noreferrer" className="btn-outline-gold w-full mt-4" data-testid="whatsapp-book">
            <MessageCircle className="w-4 h-4" /> Book on WhatsApp
          </a>

          <div className="flex items-center justify-center gap-2 mt-4 text-white/40 text-xs">
            <ShieldCheck className="w-3 h-3 text-brand-gold" /> Your information is safe with us.
          </div>
        </form>
      </section>
    </div>
  );
}
