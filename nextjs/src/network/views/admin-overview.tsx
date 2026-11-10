'use client';

import Link from 'next/link';
import * as D from '../lib/data';
import { useSessionState, useStore } from '../lib/hooks';
import { PageHead } from '../components/Shell';
import { Badge, Card, Empty, Icon, initials, Kpi, Loading } from '../components/ui';
import { BarChart, DonutWithLegend, Gauge, LineChart } from '../components/charts';
import { Drawers, DrawerState } from '../components/booking';
import { useState } from 'react';

export const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0);
export function RangePill({ range, setRange }: { range: number; setRange: (n: number) => void }) {
  const from = D.addDays(D.today(), -(range - 1));
  return <label className="pill-btn"><Icon name="calendar" /><span>
    <select value={range} onChange={(e) => setRange(+e.target.value)} aria-label="Date range">
      {[7, 30, 90].map((r) => <option key={r} value={r}>Last {r} Days</option>)}
    </select>
    <small>{D.fmtDate(from, { day: 'numeric', month: 'short' })} – {D.fmtDate(D.today(), { day: 'numeric', month: 'short', year: 'numeric' })}</small>
  </span></label>;
}

export default function AdminOverview() {
  const s = useStore();
  const [range, setRange] = useSessionState('admin-range', 30);
  const [d, setD] = useState<DrawerState>(null);
  if (!s) return <Loading />;

  const t = D.today(), from = D.addDays(t, -(range - 1));
  const inR = s.bookings.filter((b) => D.inRange(b, from, t));
  const prev = s.bookings.filter((b) => D.inRange(b, D.addDays(from, -range), D.addDays(from, -1)));
  const tot = D.totals(inR), ptot = D.totals(prev);
  const approved = s.salons.filter((x) => x.status === 'approved');
  const pendingSalons = s.salons.filter((x) => x.status === 'pending').length;
  const active = s.experts.filter((x) => x.status === 'active');
  const owedSalons = approved.map((x) => D.payable(s, 'salon', x.id)).filter((p) => p.amount > 0);
  const owedExperts = s.experts.map((x) => D.payable(s, 'expert', x.id)).filter((p) => p.amount > 0);
  const owed = owedSalons.reduce((a, p) => a + p.amount, 0) + owedExperts.reduce((a, p) => a + p.amount, 0);

  const days = Array.from({ length: range }, (_, i) => D.addDays(from, i));
  const live = (b: D.Booking) => b.status !== 'cancelled' && b.status !== 'noshow';
  const lab = (x: string) => D.fmtDate(x, { day: 'numeric', month: 'short' });
  const revenue = days.map((x) => ({ label: lab(x), tip: D.fmtDate(x), value: inR.filter((b) => b.date === x && live(b)).reduce((a, b) => a + b.split.price, 0) }));
  const share = days.map((x) => ({ label: lab(x), tip: D.fmtDate(x), value: inR.filter((b) => b.date === x && live(b)).reduce((a, b) => a + b.split.arman, 0) }));
  const counts = days.map((x) => ({ label: lab(x), tip: D.fmtDate(x), value: inR.filter((b) => b.date === x && live(b)).length }));

  const bySvc = new Map<string, number>();
  inR.filter(live).forEach((b) => bySvc.set(b.serviceId, (bySvc.get(b.serviceId) || 0) + b.split.price));
  const mix = [...bySvc.entries()].sort((a, b) => b[1] - a[1]);
  const mixParts = mix.slice(0, 4).map(([id, v]) => ({ label: D.svc(id, s)?.name ?? id, value: v }));
  if (mix.length > 4) mixParts.push({ label: 'Others', value: mix.slice(4).reduce((a, [, v]) => a + v, 0) });

  const todays = s.bookings.filter((b) => b.date === t && live(b)).sort((a, b) => b.start - a.start).slice(0, 5);
  const bySalon = approved.map((x) => ({ x, rev: inR.filter((b) => b.salonId === x.id && live(b)).reduce((a, b) => a + b.split.price, 0) })).sort((a, b) => b.rev - a.rev);
  const topRev = bySalon.reduce((a, r) => a + r.rev, 0) || 1;

  type Tx = { at: number; date: string; label: string; party: string; ref: string; amount: number; status: string };
  const txs: Tx[] = [
    ...s.bookings.filter((b) => b.payment !== 'pending').map((b) => ({ at: Date.parse(b.date) + b.end * 60000, date: b.date, label: b.payment === 'refunded' ? 'Customer refund' : 'Customer payment', party: b.customer.name || 'Client', ref: b.id, amount: b.payment === 'refunded' ? -b.split.price : b.split.price, status: b.payment === 'refunded' ? 'refunded' : 'success' })),
    ...s.settlements.map((x) => ({ at: Date.parse(x.date) + 86_399_000, date: x.date, label: x.kind === 'salon' ? 'Salon settlement' : 'Expert payout', party: (x.kind === 'salon' ? D.salon(x.partyId, s)?.name : D.expert(x.partyId, s)?.name) ?? x.partyId, ref: `${x.bookingIds.length} jobs`, amount: -x.amount, status: 'settled' })),
  ].filter((x) => x.date <= t).sort((a, b) => b.at - a.at).slice(0, 5);

  const chairsAll = approved.flatMap((x) => x.chairs); const chairsOn = chairsAll.filter((c) => c.active).length;
  const finished = inR.filter((b) => ['completed', 'cancelled', 'noshow'].includes(b.status));
  const doneCount = finished.filter((b) => b.status === 'completed').length;
  const completedAll = s.bookings.filter((b) => b.status === 'completed');
  const settledIds = new Set(s.settlements.flatMap((x) => x.bookingIds));
  const health = [
    ['Salon availability', chairsAll.length ? Math.round((chairsOn / chairsAll.length) * 100) : 0],
    ['Expert availability', s.experts.length ? Math.round((active.length / s.experts.length) * 100) : 0],
    ['Booking success rate', finished.length ? Math.round((doneCount / finished.length) * 100) : 100],
    ['Settlement up to date', completedAll.length ? Math.round((completedAll.filter((b) => settledIds.has(b.id)).length / completedAll.length) * 100) : 100],
  ] as const;
  const score = health.reduce((a, [, v]) => a + v, 0) / health.length;
  const signed = (n: number) => `${n >= 0 ? '' : '-'}${D.inr(Math.abs(n))}`;
  const arrow = (a: number, b: number) => (!b ? 'New this period' : (a >= b ? '↑ +' : '↓ ') + pct(a, b) + '% vs previous');

  return <>
    <PageHead hello title="Super Admin Dashboard" sub="Complete control of the Arman Hair Studio Partner Network" tools={<RangePill range={range} setRange={setRange} />} />

    <div className="kpis">
      <Kpi icon="store" label="Salon Partners" value={approved.length} delta={pendingSalons ? `+${pendingSalons} awaiting approval` : 'All approved'} tone={pendingSalons ? 'up' : undefined} />
      <Kpi icon="scissors" label="Experts" value={s.experts.length} delta={`${active.length} working today`} />
      <Kpi icon="calendarCheck" label="Total Bookings" value={tot.count.toLocaleString('en-IN')} delta={arrow(tot.count, ptot.count)} tone={tot.count >= ptot.count ? 'up' : 'down'} />
      <Kpi icon="rupee" label="Total Revenue" value={D.inr(tot.revenue)} delta={arrow(tot.revenue, ptot.revenue)} tone={tot.revenue >= ptot.revenue ? 'up' : 'down'} />
      <Kpi icon="coins" label="Arman Contribution" value={D.inr(tot.arman)} delta={`${tot.revenue ? Math.round((tot.arman / tot.revenue) * 100) : 0}% of revenue`} />
      <Kpi icon="handCoins" label="Pending Settlements" value={D.inr(owed)} delta={`${owedSalons.length} salons · ${owedExperts.length} experts`} />
    </div>

    <div className="grid g-dash">
      <Card title="Revenue Trend" actions={<div className="legend"><span><i style={{ background: '#b8892f' }} />Revenue</span><span><i style={{ background: '#e3c27c' }} />Arman share</span></div>}>
        <LineChart series={[{ name: 'Revenue', color: '#b8892f', points: revenue, area: true }, { name: 'Arman share', color: '#e3c27c', points: share }]} />
      </Card>
      <Card title="Bookings Trend" actions={<div className="legend"><span><i style={{ background: 'var(--bar)' }} />Bookings</span></div>}>
        <BarChart data={counts} fmt={(v) => `${v} bookings`} />
      </Card>
      <Card title="Service Mix" sub="(Revenue)">
        {mixParts.length ? <DonutWithLegend parts={mixParts} center={D.inr(tot.revenue)} sub="Total" /> : <Empty title="No revenue yet" text="Service mix appears after the first bookings." />}
      </Card>
    </div>

    <div className="grid g-main" style={{ marginTop: 16 }}>
      <Card flush title={<>Live Booking Activity <span className="live-dot" style={{ marginLeft: 8, fontFamily: 'var(--font-manrope)' }}>Live</span></>} actions={<Link className="btn sm" href="/network/admin/live">View Live Schedule</Link>}>
        {todays.length ? <div className="table-wrap"><table className="t"><tbody>{todays.map((b) => <tr key={b.id} className="click" onClick={() => setD({ kind: 'booking', id: b.id })}>
          <td className="num" style={{ whiteSpace: 'nowrap' }}>{D.hm12(b.start)}</td>
          <td><div className="who"><span className="mono-av">{initials(b.customer.name || '?')}</span><b>{b.customer.name}</b></div></td>
          <td>{D.svc(b.serviceId, s)?.name}</td><td>{D.salon(b.salonId, s)?.name}</td><td>{D.expert(b.expertId, s)?.name}</td>
          <td className="r"><Badge s={b.status} /></td></tr>)}</tbody></table></div> : <Empty title="No bookings today" text="Today's appointments appear here as they come in." />}
      </Card>
      <Card title="Partner Performance" actions={<Link className="btn sm" href="/network/admin/salons">View all</Link>}>
        <div className="muted small" style={{ marginTop: -8, marginBottom: 12 }}>Top performing salons by revenue (last {range} days)</div>
        <div className="stack">{bySalon.slice(0, 4).map((r, i) => <div key={r.x.id} className="row">
          <span className="rank">{i + 1}</span>
          <div className="grow"><div className="row spread"><b>{r.x.name}, {r.x.area}</b><b className="num">{D.inr(r.rev)}</b></div>
            <div className="row" style={{ marginTop: 6 }}><div className="bar-track grow"><div style={{ width: `${(r.rev / topRev) * 100}%` }} /></div><span className="small muted num" style={{ width: 36, textAlign: 'right' }}>{Math.round((r.rev / topRev) * 100)}%</span></div></div>
        </div>)}</div>
      </Card>
    </div>

    <div className="grid g-tx" style={{ marginTop: 16 }}>
      <Card flush title="Recent Transactions" actions={<Link className="btn sm" href="/network/admin/finance">View all</Link>}>
        {txs.length ? <div className="table-wrap"><table className="t"><thead><tr><th>Date</th><th>Transaction</th><th>Party</th><th className="r">Amount</th><th>Status</th></tr></thead>
          <tbody>{txs.map((x, i) => <tr key={i}><td style={{ whiteSpace: 'nowrap' }}>{D.fmtDate(x.date, { day: 'numeric', month: 'short' })}</td><td>{x.label}</td><td>{x.party}<div className="cell-sub">{x.ref}</div></td><td className="r num"><b>{signed(x.amount)}</b></td><td><Badge s={x.status} /></td></tr>)}</tbody></table></div>
          : <Empty title="No transactions yet" text="Payments and payouts will be listed here." />}
      </Card>
      <Card title="Network Health">
        <div className="health"><Gauge value={score} label="Operational health" />
          <ul>{health.map(([l, v]) => <li key={l}><Icon name="checkCircle" /><span>{l}</span><b className="num">{v}%</b></li>)}</ul></div>
      </Card>
      <Card title="Quick Actions">
        <div className="qa-grid">
          <Link className="qa" href="/network/admin/live"><Icon name="calendarCheck" />New Booking</Link>
          <Link className="qa" href="/network/admin/salons?new=1"><Icon name="store" />Onboard Salon</Link>
          <Link className="qa" href="/network/admin/experts?new=1"><Icon name="userPlus" />Add Expert</Link>
          <Link className="qa" href="/network/admin/services"><Icon name="tag" />Update Pricing</Link>
        </div>
      </Card>
    </div>
    <Drawers s={s} d={d} setD={setD} date={t} role="admin" />
  </>;
}
