'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import * as D from '../lib/data';
import { act } from '../lib/actions';
import { currentProfile, signOut } from '../lib/supabase';
import { useSessionState, useStore } from '../lib/hooks';
import { useGuard } from '../components/Shell';
import { attempt, Badge, Empty, Icon, Kpi, Loading, Logo, Switch } from '../components/ui';

const B = '/network/expert';
const TABS: [string, string, string][] = [[B, 'Today', 'clock'], [`${B}/upcoming`, 'Upcoming', 'calendar'], [`${B}/earnings`, 'Earnings', 'wallet'], [`${B}/profile`, 'Profile', 'user']];

function useExpertId(s: D.State | null): [string, (v: string) => void, boolean] {
  const [pick, setPick] = useSessionState('expert-id', 'rohan');
  const prof = typeof window !== 'undefined' && D.REMOTE ? currentProfile() : null;
  const locked = !!prof && prof.role === 'expert' && !!prof.expert_id;
  const id = locked ? prof!.expert_id! : s?.experts.some((x) => x.id === pick) ? pick : s?.experts[0]?.id ?? pick;
  return [id, setPick, locked];
}

export function ExpertShell({ children }: { children: ReactNode }) {
  const s = useStore();
  const guard = useGuard('expert');
  const path = usePathname() || '';
  const router = useRouter();
  const [id, setId, locked] = useExpertId(s);
  if (!guard.ok || !s) return <Loading />;
  const ex = D.expert(id, s);
  if (!ex) return <Loading text="Expert not found" />;
  return <div className="phone">
    <header className="phone-top">
      <div className="row spread"><Link href="/network" aria-label="Home"><Logo height={30} /></Link>
        {!locked ? <label><span className="sr">Expert</span><select value={id} onChange={(e) => setId(e.target.value)}>{s.experts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          : <button className="btn sm dark" onClick={async () => { await signOut(); router.replace('/network/login'); }}>Sign out</button>}</div>
      <div className="row spread" style={{ marginTop: 18 }}>
        <div><h1>Hi, {ex.name.split(' ')[0]}</h1><div style={{ color: '#a39a86', fontSize: 13 }}>Arman expert · {ex.status === 'active' ? 'Taking bookings' : 'On leave'}</div></div>
        <div className="row" style={{ gap: 8 }}><span style={{ fontSize: 12.5, color: ex.status === 'active' ? '#6fcf97' : '#a39a86', fontWeight: 600 }}>{ex.status === 'active' ? 'Online' : 'Offline'}</span>
          <Switch on={ex.status === 'active'} label="Available for bookings" onToggle={() => attempt(act.updateExpert(ex.id, { status: ex.status === 'active' ? 'leave' : 'active' }), ex.status === 'active' ? 'Marked on leave. Existing jobs stay.' : 'You are taking bookings')} /></div>
      </div>
    </header>
    <main className="phone-body">{children}</main>
    <nav className="phone-tabs" aria-label="Expert app">{TABS.map(([href, l, ic]) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}><Icon name={ic} />{l}</Link>)}</nav>
  </div>;
}

function useExpertPage() {
  const s = useStore();
  const [id] = useExpertId(s);
  const ex = s ? D.expert(id, s) : null;
  return { s, ex, mine: s && ex ? s.bookings.filter((b) => b.expertId === ex.id && b.status !== 'cancelled' && b.status !== 'noshow') : [] };
}

function Job({ s, b }: { s: D.State; b: D.Booking }) {
  const sv = D.svc(b.serviceId, s), sal = D.salon(b.salonId, s), ch = D.chairOf(b, s);
  const live = b.status === 'checkedin' || b.status === 'inservice';
  const isToday = b.date === D.today();
  const qty = (pid: string, delta: number) => {
    const list = b.productsUsed.map((p) => ({ ...p }));
    const p = list.find((x) => x.id === pid); if (p) p.qty = Math.max(0, p.qty + delta); else if (delta > 0) list.push({ id: pid, qty: delta });
    void attempt(act.setProducts(b.id, list.filter((x) => x.qty > 0)), '');
  };
  let action: ReactNode = null;
  if (isToday && b.status === 'confirmed') action = <button className="btn gold" onClick={() => attempt(act.setStatus(b.id, 'checkedin'), 'Checked in at salon')}><Icon name="pin" />Check in at salon</button>;
  if (b.status === 'checkedin') action = <button className="btn gold" onClick={() => attempt(act.setStatus(b.id, 'inservice'), 'Service started')}>Start service</button>;
  if (b.status === 'inservice') action = <button className="btn gold" onClick={() => { if (window.confirm('Mark this job complete? The customer confirms the service is done.')) void attempt(act.setStatus(b.id, 'completed'), 'Job completed. Earnings updated.'); }}><Icon name="check" />Complete job</button>;
  return <article className={`job ${live ? 'current' : ''}`}>
    <div className="row spread"><span className="when">{D.hm12(b.start)} – {D.hm12(b.end)}</span><Badge s={b.status} /></div>
    <div style={{ fontWeight: 700, marginTop: 6 }}>{sv?.name}</div>
    <div className="muted small">Client: {b.customer.name}</div>
    <div className="muted small">{sal?.name}, {sal?.area} · {ch?.name}</div>
    {b.split.travel > 0 && <div className="small" style={{ color: 'var(--warn)', marginTop: 4 }}>Travel allowance +{D.inr(b.split.travel)}</div>}
    {b.status === 'inservice' && sal && <div style={{ marginTop: 12, borderTop: '1px dashed var(--line)', paddingTop: 10 }}>
      <div className="muted small" style={{ fontWeight: 600, marginBottom: 6 }}>Salon products used</div>
      {Object.keys(sal.rates).map((k) => { const n = b.productsUsed.find((p) => p.id === k)?.qty || 0; return <div key={k} className="row spread" style={{ padding: '4px 0' }}>
        <span>{s.catalog[k]?.name}<div className="cell-sub">{D.inr(sal.rates[k])} / {s.catalog[k]?.unit}</div></span>
        <span className="qty"><button onClick={() => qty(k, -1)} aria-label="Less">−</button><span>{n}</span><button onClick={() => qty(k, 1)} aria-label="More">+</button></span></div>; })}
    </div>}
    {action && <div className="row wrap" style={{ marginTop: 12 }}>{action}</div>}
  </article>;
}

export function ExpertToday() {
  const { s, ex, mine } = useExpertPage();
  if (!s || !ex) return <Loading />;
  const list = mine.filter((b) => b.date === D.today()).sort((a, b) => a.start - b.start);
  const left = list.filter((b) => b.status !== 'completed').length;
  return <>
    <h2 className="serif" style={{ fontSize: 20 }}>{D.fmtDate(D.today(), { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
    <p className="muted" style={{ margin: '2px 0 14px' }}>{left} of {list.length} jobs left</p>
    {list.length ? list.map((b) => <Job key={b.id} s={s} b={b} />) : <Empty title="No jobs today" text={ex.status === 'active' ? 'New bookings will appear here.' : 'You are on leave, so no new jobs are assigned.'} />}
  </>;
}

export function ExpertUpcoming() {
  const { s, ex, mine } = useExpertPage();
  if (!s || !ex) return <Loading />;
  const list = mine.filter((b) => b.date > D.today()).sort((a, b) => (a.date + D.pad(a.start)).localeCompare(b.date + D.pad(b.start)));
  if (!list.length) return <Empty title="Nothing scheduled yet" text="Upcoming jobs appear here as customers book." />;
  const days = [...new Set(list.map((b) => b.date))];
  return <>{days.map((x) => <section key={x}><h2 className="serif" style={{ fontSize: 18, margin: '14px 0 8px' }}>{D.fmtDate(x)}</h2>{list.filter((b) => b.date === x).map((b) => <Job key={b.id} s={s} b={b} />)}</section>)}</>;
}

export function ExpertEarnings() {
  const { s, ex, mine } = useExpertPage();
  if (!s || !ex) return <Loading />;
  const month = D.today().slice(0, 8);
  const done = mine.filter((b) => b.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));
  const mth = done.filter((b) => b.date.startsWith(month));
  const p = D.payable(s, 'expert', ex.id);
  return <>
    <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <Kpi icon="coins" label="This month" value={D.inr(mth.reduce((a, b) => a + b.split.expertPay + b.split.travel, 0))} delta={`${mth.length} jobs`} />
      <Kpi icon="handCoins" label="Awaiting payout" value={D.inr(p.amount)} delta={`${p.open.length} jobs`} />
    </div>
    <h2 className="serif" style={{ fontSize: 18, margin: '6px 0 8px' }}>Recent jobs</h2>
    {done.length ? <div className="card flush"><table className="t"><tbody>{done.slice(0, 25).map((b) => <tr key={b.id}><td>{D.svc(b.serviceId, s)?.name}<div className="cell-sub">{D.fmtDate(b.date, { day: 'numeric', month: 'short' })} · {D.salon(b.salonId, s)?.name}</div></td><td className="r num"><b>{D.inr(b.split.expertPay + b.split.travel)}</b>{b.split.travel > 0 && <div className="cell-sub">incl. travel</div>}</td></tr>)}</tbody></table></div>
      : <Empty title="No completed jobs yet" text="Earnings appear when you complete a job." />}
    {p.history.length > 0 && <><h2 className="serif" style={{ fontSize: 18, margin: '16px 0 8px' }}>Payouts received</h2><div className="card flush"><table className="t"><tbody>{[...p.history].reverse().map((h) => <tr key={h.id}><td>{D.fmtDate(h.date)}<div className="cell-sub">{h.bookingIds.length} jobs</div></td><td className="r num">{D.inr(h.amount)}</td></tr>)}</tbody></table></div></>}
  </>;
}

export function ExpertProfile() {
  const { s, ex } = useExpertPage();
  if (!s || !ex) return <Loading />;
  return <div className="card">
    <dl className="kv"><dt>Name</dt><dd>{ex.name}</dd>{ex.phone && <><dt>Mobile</dt><dd>{ex.phone}</dd></>}<dt>Based in</dt><dd>{ex.home}</dd><dt>Hours</dt><dd>{D.hm12(ex.start)}–{D.hm12(ex.end)}</dd><dt>Rating</dt><dd>★ {ex.rating.toFixed(1)}</dd></dl>
    <h2 className="serif" style={{ fontSize: 18, margin: '18px 0 8px' }}>Services you can take</h2>
    <div>{ex.skills.flatMap((k) => s.services.filter((v) => v.skill === k)).map((v) => <span key={v.id} className="chip">{v.name}</span>)}</div>
    <p className="muted small" style={{ marginTop: 16 }}>Skills and hours are managed by Arman. Ask your manager to change them.</p>
  </div>;
}
