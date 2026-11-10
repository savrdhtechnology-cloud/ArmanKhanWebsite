'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import * as D from '../lib/data';
import { signIn } from '../lib/supabase';
import { useStore } from '../lib/hooks';
import { Icon, Logo, toast } from '../components/ui';

const PORTALS = [
  { href: '/network/book', icon: 'calendarCheck', name: 'Book an appointment', who: 'For customers', text: 'Pick a service, area and time. The platform finds a free chair at a partner salon and the right Arman expert.' },
  { href: '/network/admin', icon: 'crown', name: 'Super Admin', who: 'For the Arman team', text: 'Network overview, live seat schedule, partner salons, experts, customers, pricing, settlements and reports.' },
  { href: '/network/partner', icon: 'store', name: 'Salon Partner', who: 'For partner salons', text: 'Chairs, wash stations, open hours, product rates, today’s Arman bookings and payouts.' },
  { href: '/network/expert', icon: 'scissors', name: 'Expert app', who: 'For Arman experts', text: 'Today’s jobs, check-in at the salon, products used, job completion and earnings.' },
];

export function NetworkHome() {
  const s = useStore();
  const approved = s?.salons.filter((x) => x.status === 'approved') ?? [];
  const chairs = approved.reduce((n, x) => n + x.chairs.filter((c) => c.active).length, 0);
  const todayCount = s?.bookings.filter((b) => b.date === D.today() && b.status !== 'cancelled').length ?? 0;
  return <div className="dark-page"><div className="dark-in">
    <div className="dark-top"><Link href="/" aria-label="Arman Hair Studio website"><Logo height={52} /></Link><Link className="back" href="/">Back to the Arman website</Link></div>
    <section className="hero">
      <div>
        <h1>Your brand and experts, in partner salons across Bhopal.</h1>
        <p>Arman owns the clients, pricing and quality. Partner salons rent out chairs and facilities. This platform books, allocates, serves and settles every appointment.{s ? ` Right now: ${approved.length} partner salons and ${chairs} live chairs${D.REMOTE ? '' : `, ${todayCount} bookings today`}.` : ''}</p>
        <Link className="btn gold lg" href="/network/book">Book an appointment</Link>
      </div>
      <ol className="flow" aria-label="How one booking flows">
        <li><b>Customer books</b><span>Service, area, date and time</span></li>
        <li><b>Platform allocates</b><span>Free chair with the right facilities and a qualified, free expert, held for 5 minutes</span></li>
        <li><b>Expert serves</b><span>Checks in at the partner salon, logs products used, completes the job</span></li>
        <li><b>Payment is recorded</b><span>Customer pays Arman; invoice is shared</span></li>
        <li><b>Settlement</b><span>Salon gets space fee + products, expert gets payout + travel, Arman keeps the rest</span></li>
      </ol>
    </section>
    <nav className="portals" aria-label="Portals">
      {PORTALS.map((p) => <Link key={p.href} className="portal" href={p.href}><Icon name={p.icon} /><div><h3>{p.name}</h3><div style={{ color: '#d9b86c', fontSize: 12.5 }}>{p.who}</div></div><p>{p.text}</p><span className="go">Open</span></Link>)}
    </nav>
    {D.REMOTE ? <p className="dark-note">Team portals need a sign-in. <Link href="/network/login" style={{ color: '#e2c27d' }}>Sign in</Link></p>
      : <p className="dark-note">Preview mode: screens run on sample data stored in this browser, so a booking made in one portal shows in the others. <button onClick={() => { if (window.confirm('Reset all demo bookings and settings in this browser?')) { D.resetDemo(); toast('Demo data reset'); } }}>Reset demo data</button></p>}
  </div></div>;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const p = await signIn(email.trim(), password);
      D.reload();
      const next = params.get('next');
      router.replace(next && next.startsWith('/network/') ? next : p.role === 'admin' ? '/network/admin' : p.role === 'partner' ? '/network/partner' : '/network/expert');
    } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  };
  if (!D.REMOTE) return <div className="login-box"><h1>Preview mode</h1><p style={{ color: '#a39a86' }}>Sign-in turns on once Supabase is connected. For now every portal opens with sample data.</p><Link className="btn gold" href="/network">Open portals</Link></div>;
  return <form className="login-box stack" onSubmit={submit}>
    <h1>Team sign in</h1>
    <p style={{ color: '#a39a86', margin: 0 }}>For the Arman team, partner salons and Arman experts.</p>
    <label className="field"><span>Email</span><input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
    <label className="field"><span>Password</span><input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
    {err && <div className="notice bad" role="alert">{err}</div>}
    <button className="btn gold lg" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
  </form>;
}

export function NetworkLogin() {
  return <div className="dark-page"><div className="dark-in">
    <div className="dark-top"><Link href="/network" aria-label="Partner network home"><Logo height={52} /></Link><Link className="back" href="/network">All portals</Link></div>
    <Suspense fallback={null}><LoginForm /></Suspense>
  </div></div>;
}
