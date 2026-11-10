'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { addDays, Payment, Status, STATUS_LABEL, today } from '../lib/data';

const P: Record<string, string> = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
  calendarCheck: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 10h18M9 15.5l2 2 4-4"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  store: '<path d="M3 9l1.6-5h14.8L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  userPlus: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2M19 14v6M16 17h6"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  coins: '<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v4c0 1.7 2.7 3 6 3s6-1.3 6-3V6M3 10v4c0 1.7 2.7 3 6 3 1 0 2-.1 2.8-.4"/><ellipse cx="16" cy="15" rx="5" ry="2.5"/><path d="M11 15v3.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V15"/>',
  rupee: '<path d="M6 3h12M6 8h12M14.5 21 7 13h2a5 5 0 0 0 0-10"/>',
  wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16V7"/><path d="M16 14h.01"/>',
  handCoins: '<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.9l-4.2 3.9"/><circle cx="16" cy="6" r="3"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 17V11M13 17V7M18 17v-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.8-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.8H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9.9 3V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.8 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.8H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.1z"/>',
  palette: '<path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3A2 2 0 0 1 12 22z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16.5" cy="10.5" r="1"/>',
  chair: '<path d="M6 19v2M18 19v2M5 11V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5"/><path d="M3 11h18v5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  crown: '<path d="M2 8l4 10h12l4-10-6 4-4-7-4 7z"/><path d="M6 21h12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  receipt: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
};

export function Icon({ name, size, className }: { name: string; size?: number; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={size ? { width: size, height: size } : undefined} dangerouslySetInnerHTML={{ __html: P[name] || '' }} />;
}

const TONE: Record<string, string> = { confirmed: 'info', checkedin: 'warn', inservice: 'gold', completed: 'good', cancelled: 'bad', noshow: 'bad', paid: 'good', pending: 'warn', refunded: 'bad', approved: 'good', active: 'good', suspended: 'bad', leave: 'warn', settled: 'info', success: 'good' };
const LABEL: Record<string, string> = { ...STATUS_LABEL, inservice: 'In Progress', checkedin: 'Checked In', paid: 'Paid', pending: 'Pending', refunded: 'Refunded', approved: 'Approved', suspended: 'Suspended', active: 'Active', leave: 'On leave', settled: 'Settled', success: 'Success' };
export function Badge({ s, label }: { s: Status | Payment | string; label?: string }) {
  return <span className={`badge ${TONE[s] || ''}`}>{label ?? LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1)}</span>;
}

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export function Empty({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return <div className="empty"><b>{title}</b>{text}{children && <div style={{ marginTop: 12 }}>{children}</div>}</div>;
}

export function Logo({ height = 44 }: { height?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/assets/arman-logo.png" alt="Arman Hair Studio" style={{ height, width: 'auto', display: 'block' }} />;
}

export function Kpi({ icon, label, value, delta, tone }: { icon: string; label: string; value: ReactNode; delta?: ReactNode; tone?: 'up' | 'down' }) {
  return <div className="kpi"><Icon name={icon} /><div className="l">{label}</div><div className="v num">{value}</div>{delta !== undefined && <div className={`d ${tone || ''}`}>{delta}</div>}</div>;
}

export function Card({ title, sub, actions, children, flush, className }: { title?: ReactNode; sub?: ReactNode; actions?: ReactNode; children: ReactNode; flush?: boolean; className?: string }) {
  return <section className={`card ${flush ? 'flush' : ''} ${className || ''}`}>
    {(title || actions) && <div className="card-h"><h2>{title}{sub && <small>{sub}</small>}</h2>{actions && <div className="row wrap">{actions}</div>}</div>}
    {children}
  </section>;
}

// ---------- Toast (imperative so any handler can call it) ----------
export function toast(msg: string, tone: '' | 'bad' = '') {
  let box = document.querySelector<HTMLDivElement>('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
  const t = document.createElement('div'); t.className = 'toast ' + tone; t.textContent = msg; box.append(t);
  window.setTimeout(() => t.remove(), 3400);
}
/** Run an action that resolves to an error message (or null) and toast the outcome. */
export async function attempt(p: Promise<string | null>, ok: string) {
  const err = await p;
  if (err) toast(err, 'bad'); else if (ok) toast(ok);
  return !err;
}

// ---------- Drawer ----------
export function Drawer({ title, sub, onClose, children, footer }: { title: ReactNode; sub?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    ref.current?.querySelector<HTMLElement>('.body input, .body select, footer .btn, [data-close]')?.focus();
    return () => document.removeEventListener('keydown', key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>
    <div className="scrim" onClick={onClose} />
    <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-title" ref={ref}>
      <header><div><h2 id="dr-title">{title}</h2>{sub && <div className="muted small" style={{ marginTop: 2 }}>{sub}</div>}</div>
        <button className="icon-btn" data-close onClick={onClose} aria-label="Close"><Icon name="x" /></button></header>
      <div className="body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </aside>
  </>;
}

export function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  return <div className="row">
    <button className="btn sm" onClick={() => onChange(addDays(date, -1))} aria-label="Previous day">‹</button>
    <input type="date" className="input" style={{ width: 'auto' }} value={date} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label="Date" />
    <button className="btn sm" onClick={() => onChange(addDays(date, 1))} aria-label="Next day">›</button>
    {date !== today() && <button className="btn sm" onClick={() => onChange(today())}>Today</button>}
  </div>;
}

export function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return <div className="seg" role="group" aria-label={label}>
    {options.map(([k, l]) => <button key={String(k)} aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>)}
  </div>;
}

export function Tabs<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string, number?][]; onChange: (v: T) => void; label: string }) {
  return <div className="tabs" role="group" aria-label={label}>
    {options.map(([k, l, n]) => <button key={k} aria-pressed={value === k} onClick={() => onChange(k)}>{l}{n !== undefined && <b>({n})</b>}</button>)}
  </div>;
}

export function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return <button className="switch" role="switch" aria-checked={on} aria-label={label} onClick={onToggle} />;
}

export function Loading({ text = 'Loading…' }: { text?: string }) { return <div className="loading">{text}</div>; }
