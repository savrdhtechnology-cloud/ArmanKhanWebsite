'use client';

import { useState } from 'react';
import * as D from '../lib/data';
import { act } from '../lib/actions';
import { Theme, useSessionState, useStore, useTheme } from '../lib/hooks';
import { PageHead } from '../components/Shell';
import { attempt, Badge, Card, Empty, Icon, Kpi, Loading, toast } from '../components/ui';
import { BarChart, DonutWithLegend, LineChart, SplitBar } from '../components/charts';
import { RangePill } from './admin-overview';

// =====================================================================
// Finance & settlements
// =====================================================================
export function AdminFinance() {
  const s = useStore();
  const [busy, setBusy] = useState('');
  if (!s) return <Loading />;
  const all = D.totals(s.bookings.filter((b) => b.date <= D.today()));
  const salonsOwed = s.salons.filter((x) => x.status !== 'pending').map((x) => ({ x, p: D.payable(s, 'salon', x.id) }));
  const expertsOwed = s.experts.map((x) => ({ x, p: D.payable(s, 'expert', x.id) }));
  const settle = async (kind: 'salon' | 'expert', id: string, name: string, amount: number) => {
    if (!window.confirm(`Record a payout of ${D.inr(amount)} to ${name}?`)) return;
    setBusy(kind + id); await attempt(act.settle(kind, id), `Settled ${D.inr(amount)} to ${name}`); setBusy('');
  };
  const row = (kind: 'salon' | 'expert', id: string, name: string, sub: string, p: ReturnType<typeof D.payable>) => {
    const last = p.history[p.history.length - 1];
    return <tr key={id}><td><b>{name}</b><div className="cell-sub">{sub}</div></td><td className="num">{p.open.length}</td><td className="r num"><b>{D.inr(p.amount)}</b></td>
      <td>{last ? `${D.inr(last.amount)} · ${D.fmtDate(last.date, { day: 'numeric', month: 'short' })}` : <span className="faint">Never</span>}</td>
      <td className="r"><button className={`btn sm ${p.amount ? 'gold' : ''}`} disabled={!p.amount || busy === kind + id} onClick={() => settle(kind, id, name, p.amount)}>Settle</button></td></tr>;
  };
  const hist = [...s.settlements].reverse().slice(0, 12);
  return <>
    <PageHead title="Finance & Settlements" sub="What customers paid, what each partner and expert is owed, and what Arman keeps" />
    <div className="kpis">
      <Kpi icon="rupee" label="Collected from customers" value={D.inr(all.revenue)} delta="Completed + upcoming" />
      <Kpi icon="receipt" label="Refunds" value={D.inr(all.refunds)} />
      <Kpi icon="store" label="Owed to salons" value={D.inr(salonsOwed.reduce((a, r) => a + r.p.amount, 0))} delta="Space fees + products" />
      <Kpi icon="scissors" label="Owed to experts" value={D.inr(expertsOwed.reduce((a, r) => a + r.p.amount, 0))} delta="Payouts + travel" />
      <Kpi icon="coins" label="Arman contribution" value={D.inr(all.arman)} delta="After all payouts" />
    </div>
    <div className="grid g-main">
      <div className="stack" style={{ minWidth: 0 }}>
        <Card flush title="Salon settlements" sub="completed services only"><div className="table-wrap"><table className="t"><thead><tr><th>Salon</th><th>Jobs</th><th className="r">Payable</th><th>Last paid</th><th /></tr></thead><tbody>{salonsOwed.map(({ x, p }) => row('salon', x.id, x.name, x.area, p))}</tbody></table></div></Card>
        <Card flush title="Expert payouts"><div className="table-wrap"><table className="t"><thead><tr><th>Expert</th><th>Jobs</th><th className="r">Payable</th><th>Last paid</th><th /></tr></thead><tbody>{expertsOwed.map(({ x, p }) => row('expert', x.id, x.name, x.home, p))}</tbody></table></div></Card>
      </div>
      <div className="stack" style={{ minWidth: 0 }}>
        <Card title="Example: one ₹2,500 booking"><SplitBar t={{ salonFee: 350, products: 250, expertPay: 750, travel: 150, arman: 1000 }} total={2500} /><p className="muted small" style={{ margin: '12px 0 0' }}>Every booking stores its own split when it is made, so later price changes never rewrite history.</p></Card>
        <Card flush title="Settlement history">{hist.length ? <table className="t"><tbody>{hist.map((x) => <tr key={x.id}><td>{x.kind === 'salon' ? D.salon(x.partyId, s)?.name : D.expert(x.partyId, s)?.name}<div className="cell-sub">{x.bookingIds.length} jobs · {D.fmtDate(x.date)}</div></td><td className="r num">{D.inr(x.amount)}</td><td><Badge s="settled" /></td></tr>)}</tbody></table> : <Empty title="No settlements yet" text="Settle a salon or expert to record a payout here." />}</Card>
      </div>
    </div>
  </>;
}

// =====================================================================
// Analytics & reports
// =====================================================================
export function AdminReports() {
  const s = useStore();
  const [range, setRange] = useSessionState('admin-range', 30);
  if (!s) return <Loading />;
  const t = D.today(), from = D.addDays(t, -(range - 1));
  const list = s.bookings.filter((b) => D.inRange(b, from, t) && b.status !== 'cancelled' && b.status !== 'noshow');
  const tot = D.totals(list);
  const by = (key: 'serviceId' | 'salonId' | 'expertId', name: (k: string) => string) => {
    const m = new Map<string, { n: number; rev: number; arman: number }>();
    list.forEach((b) => { const o = m.get(b[key]) || { n: 0, rev: 0, arman: 0 }; o.n++; o.rev += b.split.price; o.arman += b.split.arman; m.set(b[key], o); });
    return [...m.entries()].map(([k, o]) => ({ name: name(k), ...o })).sort((a, b) => b.rev - a.rev);
  };
  const tbl = (title: string, rows: ReturnType<typeof by>) => <Card flush title={title}><table className="t"><thead><tr><th /><th className="r">Bookings</th><th className="r">Revenue</th><th className="r">Arman share</th></tr></thead><tbody>
    {rows.length ? rows.map((r) => <tr key={r.name}><td>{r.name}</td><td className="r num">{r.n}</td><td className="r num">{D.inr(r.rev)}</td><td className="r num">{D.inr(r.arman)}</td></tr>) : <tr><td colSpan={4} className="muted">No bookings in this period</td></tr>}</tbody></table></Card>;
  const weeks = Math.ceil(range / 7);
  const weekly = Array.from({ length: weeks }, (_, i) => { const a = D.addDays(from, i * 7), z = D.addDays(a, 6); return { label: D.fmtDate(a, { day: 'numeric', month: 'short' }), tip: `Week of ${D.fmtDate(a)}`, value: list.filter((b) => D.inRange(b, a, z)).reduce((x, b) => x + b.split.price, 0) }; });
  const byHour = Array.from({ length: 12 }, (_, i) => ({ label: D.hm12((10 + i) * 60).replace(':00', ''), value: list.filter((b) => Math.floor(b.start / 60) === 10 + i).length }));
  const util = s.salons.filter((x) => x.status === 'approved').map((x) => { const cap = x.chairs.filter((c) => c.active).length * (x.close - x.open) * range; const used = list.filter((b) => b.salonId === x.id).reduce((a, b) => a + b.end - b.start, 0); return { label: x.name, value: cap ? Math.round((used / cap) * 100) : 0 }; });

  const csv = () => {
    const head = ['booking_id', 'date', 'start', 'service', 'salon', 'chair', 'expert', 'customer', 'phone', 'status', 'payment', 'price', 'salon_fee', 'products', 'expert_payout', 'travel', 'arman_share'];
    const qv = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = s.bookings.filter((b) => D.inRange(b, from, t)).map((b) => [b.id, b.date, D.hm(b.start), D.svc(b.serviceId, s)?.name, D.salon(b.salonId, s)?.name, D.chairOf(b, s)?.name, D.expert(b.expertId, s)?.name, b.customer.name, b.customer.phone, b.status, b.payment, b.split.price, b.split.salonFee, b.split.products, b.split.expertPay, b.split.travel, b.split.arman].map(qv).join(','));
    const url = URL.createObjectURL(new Blob([[head.join(','), ...rows].join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `arman-bookings-${from}-to-${t}.csv`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Report downloaded');
  };

  return <>
    <PageHead title="Analytics & Reports" sub={`${D.fmtDate(from)} to ${D.fmtDate(t)}`} tools={<><RangePill range={range} setRange={setRange} /><button className="btn gold" onClick={csv}><Icon name="download" />Download CSV</button></>} />
    <div className="kpis">
      <Kpi icon="calendarCheck" label="Bookings" value={tot.count} />
      <Kpi icon="rupee" label="Revenue" value={D.inr(tot.revenue)} />
      <Kpi icon="receipt" label="Average ticket" value={D.inr(tot.count ? tot.revenue / tot.count : 0)} />
      <Kpi icon="coins" label="Arman margin" value={`${tot.revenue ? Math.round((tot.arman / tot.revenue) * 100) : 0}%`} />
    </div>
    <div className="grid g-dash">
      <Card title="Weekly revenue"><LineChart series={[{ name: 'Revenue', color: '#b8892f', points: weekly, area: true }]} /></Card>
      <Card title="Bookings by start hour"><BarChart data={byHour} fmt={(v) => `${v} bookings`} /></Card>
      <Card title="Where the money goes"><SplitBar t={tot} total={tot.revenue} /></Card>
    </div>
    <div className="grid g2" style={{ marginTop: 16 }}>
      <Card title="Seat utilisation" sub="booked minutes ÷ open chair minutes"><BarChart data={util} color="var(--gold)" fmt={(v) => `${v}% utilised`} /></Card>
      <Card title="Revenue by service"><DonutWithLegend parts={by('serviceId', (k) => D.svc(k, s)?.name ?? k).slice(0, 5).map((r) => ({ label: r.name, value: r.rev }))} center={D.inr(tot.revenue)} sub="Revenue" /></Card>
    </div>
    <div className="grid g3" style={{ marginTop: 16 }}>
      {tbl('By service', by('serviceId', (k) => D.svc(k, s)?.name ?? k))}
      {tbl('By salon', by('salonId', (k) => D.salon(k, s)?.name ?? k))}
      {tbl('By expert', by('expertId', (k) => D.expert(k, s)?.name ?? k))}
    </div>
  </>;
}

// =====================================================================
// Appearance studio
// =====================================================================
const THEMES: { id: Theme; name: string; text: string; rail: string; bg: string; card: string }[] = [
  { id: 'ivory', name: 'Ivory Champagne', text: 'Warm ivory workspace with gold accents. Best in daylight and on print.', rail: '#0d0c0a', bg: '#f6f1e8', card: '#fffdf9' },
  { id: 'noir', name: 'Luxury Black Gold', text: 'Signature Arman black with gold. Easier on the eyes in the evening.', rail: '#0d0c0a', bg: '#0b0a08', card: '#1b1813' },
];
export function AdminAppearance() {
  const [theme, setTheme] = useTheme();
  return <>
    <PageHead title="Appearance Studio" sub="Choose how the partner network portals look on this device" />
    <Card title="Theme presets">
      <div className="grid g2">
        {THEMES.map((x) => <button key={x.id} className="theme-card" aria-pressed={theme === x.id} onClick={() => { setTheme(x.id); toast(`${x.name} applied`); }}>
          <div className="sw" style={{ background: x.bg }}><div style={{ background: x.rail, display: 'grid', alignContent: 'start', gap: 6, padding: 10 }}><i style={{ height: 8, borderRadius: 4, background: '#c9a961' }} /><i style={{ height: 6, borderRadius: 3, background: '#3a3226' }} /><i style={{ height: 6, borderRadius: 3, background: '#3a3226' }} /></div>
            <div style={{ padding: 10, display: 'grid', gap: 6, alignContent: 'start' }}><i style={{ height: 22, borderRadius: 6, background: x.card, border: '1px solid #e0d3b8' }} /><i style={{ height: 22, borderRadius: 6, background: x.card, border: '1px solid #e0d3b8' }} /></div></div>
          <b>{x.name}</b>{theme === x.id && <span className="badge gold" style={{ marginLeft: 8 }}>Current</span>}<div className="muted small">{x.text}</div>
        </button>)}
      </div>
    </Card>
    <Card title="Brand">
      <dl className="kv"><dt>Logo</dt><dd>Arman Hair Studio gold wordmark</dd><dt>Headings</dt><dd className="serif">Playfair Display</dd><dt>Body text</dt><dd>Manrope</dd><dt>Primary gold</dt><dd><span className="chip" style={{ background: 'var(--gold-grad)', color: '#1a1408' }}>#C9A961</span></dd></dl>
    </Card>
  </>;
}

// =====================================================================
// Settings
// =====================================================================
export function AdminSettings() {
  const rules: [string, string][] = [
    ['Cleanup buffer after each service', `${D.BUFFER} min`], ['Seat + expert hold while a customer confirms', `${D.HOLD_MIN} min`],
    ['Expert travel time between salons', '30 min + buffer'], ['Travel allowance per cross-salon job', D.inr(D.TRAVEL_FEE)],
    ['Booking grid step', `${D.SLOT} min`], ['Earliest same-day booking', '30 min from now'], ['Customer self-cancel window', 'Up to 2 hours before'],
  ];
  return <>
    <PageHead title="Settings" sub="Business rules the booking engine follows, and how this portal is connected" />
    <div className="grid g2">
      <Card flush title="Booking rules"><table className="t"><tbody>{rules.map(([a, b]) => <tr key={a}><td>{a}</td><td className="r"><b>{b}</b></td></tr>)}</tbody></table></Card>
      <Card title="Data & access">
        {D.REMOTE ? <div className="stack"><div className="notice">Connected to Supabase. Bookings, salons, experts and settlements are saved in the database. Partners and experts sign in with their own accounts and only see their own data.</div>
          <p className="muted small" style={{ margin: 0 }}>Create users in Supabase → Authentication, then give each one a role in the <code>profiles</code> table (admin, partner with salon, or expert with expert ID).</p></div>
          : <div className="stack"><div className="notice">Demo mode: this preview runs on sample data saved in this browser. Add the Supabase URL and anon key to the environment to go live.</div>
            <div><button className="btn danger" onClick={() => { if (window.confirm('Reset all demo data in this browser?')) { D.resetDemo(); toast('Demo data reset'); } }}>Reset demo data</button></div></div>}
      </Card>
    </div>
  </>;
}
