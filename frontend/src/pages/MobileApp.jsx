import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, Users, Download, Smartphone, Share2, CheckCircle, Calendar, BellRing, TrendingUp, MessageCircle } from "lucide-react";
import { Divider, SectionLabel } from "@/components/Divider";
import { usePWAInstall, isIOS } from "@/hooks/usePWAInstall";
import { toast } from "sonner";

const CUSTOMER_FEATURES = [
  { icon: Calendar, text: "Book appointments in seconds" },
  { icon: BellRing, text: "Get instant confirmation & reminders" },
  { icon: CheckCircle, text: "Track your booking status live" },
];

const STAFF_FEATURES = [
  { icon: Users, text: "See leads assigned to you instantly" },
  { icon: BellRing, text: "Set follow-up reminders" },
  { icon: TrendingUp, text: "Track your performance rank" },
];

export default function MobileApp() {
  const { installable, isInstalled, prompt } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const ios = isIOS();

  const handleInstall = async () => {
    setInstalling(true);
    const res = await prompt();
    setInstalling(false);
    if (res.outcome === "accepted") toast.success("App installed on your home screen!");
    else if (res.outcome === "unavailable") toast.info("Use browser menu → 'Install' or 'Add to Home Screen'");
  };

  return (
    <div data-testid="mobile-app-page" className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden pt-4 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,_rgba(201,169,97,0.12),_transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 sm:px-8 relative">
          <div className="text-center mb-10">
            <SectionLabel>Mobile Application</SectionLabel>
            <h1 className="font-playfair text-5xl sm:text-6xl text-white leading-[0.95]">
              Arman Studio <br />
              <span className="text-brand-gold italic">On Your Phone</span>
            </h1>
            <Divider />
            <p className="text-white/60 max-w-xl mx-auto">Install the app on your Android or iPhone — book appointments, track bookings, or manage the studio from anywhere.</p>
          </div>

          {/* Install CTA */}
          <div className="max-w-md mx-auto bg-[#111111] border border-brand-gold/40 p-6 mb-12 text-center" data-testid="install-card">
            <Smartphone className="w-10 h-10 text-brand-gold mx-auto mb-3" strokeWidth={1.2} />
            {isInstalled ? (
              <>
                <div className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-2">✓ Installed</div>
                <div className="text-white font-playfair text-xl mb-2">You're using the app</div>
                <p className="text-white/50 text-sm">Launch it any time from your home screen.</p>
              </>
            ) : ios ? (
              <>
                <div className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-2">Install on iPhone</div>
                <div className="text-white font-playfair text-xl mb-4">Add to Home Screen</div>
                <ol className="text-white/70 text-sm text-left space-y-2 mb-2">
                  <li>1. Tap the <Share2 className="inline w-4 h-4 text-brand-gold" /> <b>Share</b> button in Safari</li>
                  <li>2. Scroll down and tap <b>"Add to Home Screen"</b></li>
                  <li>3. Tap <b>Add</b> — you're done ✨</li>
                </ol>
              </>
            ) : installable ? (
              <>
                <div className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-2">One Tap</div>
                <div className="text-white font-playfair text-xl mb-4">Install on your device</div>
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="btn-gold w-full"
                  data-testid="install-btn"
                >
                  <Download className="w-4 h-4" /> {installing ? "Installing..." : "Install App"}
                </button>
                <p className="text-white/40 text-xs mt-3">Works offline · Instant launch · No app store needed</p>
              </>
            ) : (
              <>
                <div className="text-brand-gold text-xs uppercase tracking-[0.3em] mb-2">Install On Your Phone</div>
                <div className="text-white font-playfair text-xl mb-3">Add to Home Screen</div>
                <p className="text-white/60 text-sm mb-3">
                  Open your browser menu and tap <b className="text-brand-gold">"Install app"</b> or <b className="text-brand-gold">"Add to Home Screen"</b>.
                </p>
                <p className="text-white/40 text-xs">Chrome · Edge · Safari · Firefox — all supported.</p>
              </>
            )}
          </div>

          {/* Two portals */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer Portal */}
            <div className="bg-[#111111] border border-white/5 hover:border-brand-gold/50 p-8 transition-all duration-500 group" data-testid="customer-portal-card">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-2">For Customers</div>
                  <h2 className="font-playfair text-3xl text-white">Book &amp; Track</h2>
                </div>
                <div className="w-14 h-14 border border-brand-gold flex items-center justify-center group-hover:bg-brand-gold transition-colors">
                  <User className="w-6 h-6 text-brand-gold group-hover:text-[#050505] transition-colors" strokeWidth={1.4} />
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {CUSTOMER_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70 text-sm">
                    <f.icon className="w-4 h-4 text-brand-gold flex-shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" className="btn-gold !py-3 !text-xs" data-testid="cust-login-btn">Login</Link>
                <Link to="/register" className="btn-outline-gold !py-3 !text-xs" data-testid="cust-register-btn">Register</Link>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 text-[10px] uppercase tracking-[0.25em] text-white/40 flex items-center gap-2">
                <MessageCircle className="w-3 h-3 text-green-400" />
                Or WhatsApp <a href="https://wa.me/918878356060" target="_blank" rel="noreferrer" className="text-brand-gold ml-1">8878356060</a>
              </div>
            </div>

            {/* Staff Portal */}
            <div className="bg-[#111111] border border-white/5 hover:border-brand-gold/50 p-8 transition-all duration-500 group" data-testid="staff-portal-card">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-2">For Team</div>
                  <h2 className="font-playfair text-3xl text-white">Employee CRM</h2>
                </div>
                <div className="w-14 h-14 border border-brand-gold flex items-center justify-center group-hover:bg-brand-gold transition-colors">
                  <Users className="w-6 h-6 text-brand-gold group-hover:text-[#050505] transition-colors" strokeWidth={1.4} />
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {STAFF_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70 text-sm">
                    <f.icon className="w-4 h-4 text-brand-gold flex-shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/staff/login" className="btn-gold !py-3 !text-xs" data-testid="staff-login-btn">Staff Login</Link>
                <Link to="/admin/login" className="btn-outline-gold !py-3 !text-xs" data-testid="admin-login-btn">Admin</Link>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 text-[10px] uppercase tracking-[0.25em] text-white/40">
                Contact admin for credentials
              </div>
            </div>
          </div>

          {/* Why PWA */}
          <div className="mt-16 grid md:grid-cols-3 gap-4 text-center">
            {[
              { title: "Instant Access", sub: "One tap from your home screen — no app store needed" },
              { title: "Fullscreen App", sub: "Runs standalone without browser bars, feels native" },
              { title: "Works Offline", sub: "Cached shell loads even when the network drops" },
            ].map((f) => (
              <div key={f.title} className="bg-[#0A0A0A] border border-white/5 p-6" data-testid={`why-${f.title.split(' ')[0]}`}>
                <div className="text-brand-gold text-[10px] uppercase tracking-[0.3em] mb-2">Why</div>
                <div className="font-playfair text-white text-lg mb-1">{f.title}</div>
                <div className="text-white/50 text-xs">{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
