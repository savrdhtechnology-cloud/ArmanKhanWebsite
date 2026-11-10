'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import * as D from '../lib/data';
import { act } from '../lib/actions';
import { currentProfile } from '../lib/supabase';
import { useDay, useSessionState, useStore } from '../lib/hooks';
import { PageHead, Shell } from '../components/Shell';
import { attempt, Badge, Card, DateNav, Empty, Icon, Kpi, Loading, Switch, toast } from '../components/ui';
import { BarChart } from '../components/charts';
import { BookingTable, Drawers, DrawerState, ScheduleGrid } from '../components/booking';

const B = '/network/partner';

/** Which salon this partner screen is for: the signed-in partner's own salon, or the demo / admin picker. */
function usePartnerSalon(s: D.State | null): [string, (v: string) => void, boolean] {
  const [pick, setPick] = useSessionState('partner-salon', 'mantra');
  const prof = typeof window !== 'undefined' && D.REMOTE ? currentProfile() : null;
  const locked = !!prof && prof.role === 'partner' && !!prof.salon_id;
  const id = locked ? prof!.salon_id! : s?.salons.some((x) => x.id === pick) ? pick : s?.salons[0]?.id ?? pick;
  return [id, setPick, locked];
}

export function PartnerShell({ children }: { children: ReactNode }) {
  const s = useStore();
  const [id, setId, locked] = usePartnerSalon(s);
  const sal = s?.salons.find((x) => x.id === id);
  const nav = [
    { href: B, label: 'Dashboard', icon: 'home' },
    { href: `${B}/availability`, label: 'Availability', icon: 'grid' },
    { href: `${B}/bookings`, label: 'Bookings', icon: 'calendar' },
    { href: `${B}/facilities`, label: 'Facilities & Chairs', icon: 'chair' },
    { href: `${B}/products`, label: 'Products & Rates', icon: 'box' },
    { href: `${B}/payouts`, label: 'Payouts & Statements', icon: 'wallet' },
  ];
  const switcher = !locked && s ? <label className="switcher"><span className="sr">Salon</span><select value={id} onChange={(e) => setId(e.target.value)}>{s.salons.map((x) => <option key={x.id} value={x.id}>{x.name}, {x.area}</option>)}</select></label> : undefined;
  return <Shell portal="Partner Portal" sub={sal ? `${sal.name}, ${sal.area}` : 'Salon partner'} crest="store" role="partner" nav={nav} switcher={switcher} userName={sal?.owner || 'Salon Partner'} roleLabel="Salon Partner">{children}</Shell>;
}

function useSalonPage() {
  const s = useStore();
  const [id] = usePartnerSalon(s);
  return { s, sal: s?.salons.find((x) => x.id === id) ?? null };
}

export function PartnerDashboard() {
  const { s, sal } = useSalonPage();
  const [d, setD] = useState<DrawerState>(null);
  if (!s || !sal) return <Loading />;
  const t = D.today(), month = t.slice(0, 8);
  const mine = s.bookings.filter((b) => b.salonId === sal.id && b.status !== 'cancelled' && b.status !== 'noshow');
  const mth = mine.filter((b) => b.date.startsWith(month));
  const fees = mth.reduce((a, b) => a + b.split.salonFee, 0), prods = mth.reduce((a, b) => a + b.split.products, 0);
  const todays = mine.filter((b) => b.date === t).sort((a, b) => a.start - b.start);
  const week = Array.from({ length: 7 }, (_, i) => D.addDays(t, i));
  const earn = Array.from({ length: 14 }, (_, i) => D.addDays(t, i - 13)).map((x) => ({ label: D.fmtDate(x, { day: 'numeric', month: 'short' }), tip: D.fmtDate(x), value: mine.filter((b) => b.date === x).reduce((a, b) => a + b.split.salonFee + b.split.products, 0) }));
  return <>
    <PageHead hello title="Salon Partner Dashboard" sub="Manage your seating, availability, products and earnings" />
    {sal.status !== 'approved' && <div className="notice" style={{ marginBottom: 16 }}><b>{sal.status === 'pending' ? 'Your salon is waiting for Arman approval.' : 'Your salon is suspended.'}</b> Customers can’t book your chairs until Arman {sal.status === 'pending' ? 'approves' : 'reactivates'} it. You can still set up chairs and product rates.</div>}
    <div className="kpis">
      <Kpi icon="calendarCheck" label="Total bookings" value={mth.length} delta="This month" />
      <Kpi icon="rupee" label="Usage fees" value={D.inr(fees)} delta={`${D.inr(sal.seatFee)} per booking`} />
      <Kpi icon="box" label="Product charges" value={D.inr(prods)} delta="Used by Arman experts" />
      <Kpi icon="coins" label="Total earnings" value={D.inr(fees + prods)} delta="This month" />
      <Kpi icon="handCoins" label="Awaiting payout" value={D.inr(D.payable(s, 'salon', sal.id).amount)} />
    </div>
    <div className="grid g-main">
      <Card title="Chairs / Workstations" actions={<Link className="btn sm" href={`${B}/facilities`}>Manage</Link>}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {sal.chairs.map((c) => <div key={c.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
            <Icon name="chair" size={28} className="" /><div style={{ fontWeight: 700, marginTop: 4 }}>{c.name}</div><div className="small muted">{c.wash ? 'Wash station' : 'Basic'}</div>
            <div style={{ marginTop: 6 }}><Badge s={c.active ? 'active' : 'suspended'} label={c.active ? 'Active' : 'Inactive'} /></div></div>)}
        </div>
      </Card>
      <Card flush title={`Today’s bookings (${todays.length})`} actions={<Link className="btn sm" href={`${B}/bookings`}>View all</Link>}>
        {todays.length ? <table className="t"><tbody>{todays.map((b) => <tr key={b.id} className="click" onClick={() => setD({ kind: 'booking', id: b.id })}>
          <td className="num" style={{ whiteSpace: 'nowrap' }}>{D.hm12(b.start)}</td><td>{D.svc(b.serviceId, s)?.name}<div className="cell-sub">Expert: {D.expert(b.expertId, s)?.name}</div></td><td className="r"><span className="badge gold">{D.chairOf(b, s)?.name}</span></td></tr>)}</tbody></table>
          : <Empty title="No Arman bookings today" text="Keep chairs active and unblocked so customers can book them." />}
      </Card>
    </div>
    <div className="grid g-main" style={{ marginTop: 16 }}>
      <Card flush title="Weekly availability" sub={`${D.fmtDate(week[0], { day: 'numeric', month: 'short' })} – ${D.fmtDate(week[6], { day: 'numeric', month: 'short' })}`} actions={<Link className="btn sm" href={`${B}/availability`}>Open schedule</Link>}>
        <div className="table-wrap"><table className="t"><thead><tr><th>Chair</th>{week.map((x) => <th key={x}>{D.fmtDate(x, { weekday: 'short', day: 'numeric' })}</th>)}</tr></thead>
          <tbody>{sal.chairs.map((c) => <tr key={c.id}><td><b>{c.name}</b></td>{week.map((x) => {
            const n = mine.filter((b) => b.chairId === c.id && b.date === x).length; const blk = s.blocks.some((k) => k.salonId === sal.id && k.chairId === c.id && k.date === x);
            return <td key={x}>{!c.active ? <span className="badge">Off</span> : n ? <span className="badge warn">{n} booked</span> : blk ? <span className="badge">Blocked</span> : <span className="badge good">Free</span>}</td>;
          })}</tr>)}</tbody></table></div>
      </Card>
      <Card title="Daily earnings" sub="last 14 days"><BarChart data={earn} color="var(--gold)" fmt={(v) => D.inr(v)} /></Card>
    </div>
    <Drawers s={s} d={d} setD={setD} date={t} role="partner" />
  </>;
}

export function PartnerAvailability() {
  const { s, sal } = useSalonPage();
  const [date, setDate] = useSessionState('partner-date', D.today());
  const [d, setD] = useState<DrawerState>(null);
  useDay(date);
  if (!s || !sal) return <Loading />;
  return <>
    <PageHead title="Seat availability" sub="Live view of your chairs for Arman bookings" />
    <Card>
      <div className="filters"><div className="field"><span>Date</span><DateNav date={date} onChange={setDate} /></div>
        <div className="field" style={{ marginLeft: 'auto' }}><span>&nbsp;</span><span className="muted">Open {D.hm12(sal.open)}–{D.hm12(sal.close)}</span></div></div>
      <ScheduleGrid s={s} salonIds={[sal.id]} date={date} role="partner" onSlot={(sid, chairId, start) => setD({ kind: 'blockNew', salonId: sid, chairId, start })} onBooking={(id) => setD({ kind: 'booking', id })} onBlock={(id) => setD({ kind: 'block', id })} />
      <p className="muted small" style={{ marginBottom: 0 }}>Click a green slot to block a chair for your own client or maintenance. Arman can book any active, unblocked chair during your open hours.</p>
    </Card>
    <Drawers s={s} d={d} setD={setD} date={date} role="partner" />
  </>;
}

export function PartnerBookings() {
  const { s, sal } = useSalonPage();
  const [d, setD] = useState<DrawerState>(null);
  if (!s || !sal) return <Loading />;
  const list = s.bookings.filter((b) => b.salonId === sal.id).sort((a, b) => (b.date + D.pad(b.start)).localeCompare(a.date + D.pad(a.start)));
  return <>
    <PageHead title="Arman bookings" sub="Every appointment held at your salon. Customer contact details stay with Arman." />
    <Card flush>{list.length ? <BookingTable s={s} list={list.slice(0, 200)} cols={['when', 'id', 'service', 'chair', 'expert', 'fee', 'status']} onOpen={(id) => setD({ kind: 'booking', id })} /> : <Empty title="No bookings yet" text="Bookings appear here as soon as Arman customers book your chairs." />}</Card>
    <Drawers s={s} d={d} setD={setD} date={D.today()} role="partner" />
  </>;
}

const FACILITIES = ['Wash station', 'Steamer', 'Hood dryer', 'Bridal room', 'AC', 'Parking'];
export function PartnerFacilities() {
  const { s, sal } = useSalonPage();
  if (!s || !sal) return <Loading />;
  const toggleFac = (f: string, on: boolean) => void attempt(act.updateSalon(sal.id, { facilities: on ? [...new Set([...sal.facilities, f])] : sal.facilities.filter((x) => x !== f) }), '');
  const setHours = (k: 'open' | 'close', v: string) => {
    const m = D.toMin(v); if ((k === 'open' && m >= sal.close) || (k === 'close' && m <= sal.open)) { toast('Opening must be before closing', 'bad'); return; }
    void attempt(act.updateSalon(sal.id, { [k]: m }), 'Hours updated');
  };
  return <>
    <PageHead title="Facilities & chairs" sub="What Arman experts can use at your salon" />
    <div className="grid g2">
      <Card flush title="Chairs / workstations" actions={<button className="btn sm gold" onClick={() => attempt(act.addChair(sal.id), 'Chair added')}><Icon name="plus" />Add chair</button>}>
        <table className="t"><thead><tr><th>Chair</th><th>Wash station</th><th>Available to Arman</th></tr></thead>
          <tbody>{sal.chairs.map((c) => <tr key={c.id}><td><b>{c.name}</b></td>
            <td><Switch on={c.wash} label={`${c.name} wash station`} onToggle={() => attempt(act.updateChair(sal.id, c.id, { wash: !c.wash }), '')} /></td>
            <td><Switch on={c.active} label={`${c.name} available`} onToggle={() => attempt(act.updateChair(sal.id, c.id, { active: !c.active }), `${c.name} ${c.active ? 'turned off' : 'available'} for Arman bookings`)} /></td></tr>)}</tbody></table>
        <p className="muted small" style={{ padding: '0 18px 14px', margin: 0 }}>Turning a chair off keeps existing bookings but stops new ones on it.</p>
      </Card>
      <Card title="Facilities & open hours">
        <div className="stack">
          <div>{FACILITIES.map((f) => <label key={f} className="row" style={{ padding: '5px 0' }}><input type="checkbox" checked={sal.facilities.includes(f)} onChange={(e) => toggleFac(f, e.target.checked)} /> {f}</label>)}</div>
          <div className="grid g2"><label className="field"><span>Opens</span><input key={sal.open} className="input" type="time" defaultValue={D.hm(sal.open)} onBlur={(e) => e.target.value !== D.hm(sal.open) && setHours('open', e.target.value)} /></label>
            <label className="field"><span>Closes</span><input key={sal.close} className="input" type="time" defaultValue={D.hm(sal.close)} onBlur={(e) => e.target.value !== D.hm(sal.close) && setHours('close', e.target.value)} /></label></div>
          <p className="muted small" style={{ margin: 0 }}>Your space fee ({D.inr(sal.seatFee)} per booking) is agreed with Arman and changed by the Arman team.</p>
        </div>
      </Card>
    </div>
  </>;
}

export function PartnerProducts() {
  const { s, sal } = useSalonPage();
  if (!s || !sal) return <Loading />;
  const used: Record<string, number> = {};
  s.bookings.filter((b) => b.salonId === sal.id && b.status === 'completed' && b.date.startsWith(D.today().slice(0, 8))).forEach((b) => b.productsUsed.forEach((p) => { used[p.id] = (used[p.id] || 0) + p.qty; }));
  return <>
    <PageHead title="Products & rates" sub="Salon products Arman experts may use, and what you charge for them" />
    <Card flush><div className="table-wrap"><table className="t"><thead><tr><th>Product / brand</th><th>Unit</th><th className="r">Your rate (₹)</th><th className="r">Used this month</th><th className="r">Billed</th></tr></thead>
      <tbody>{Object.keys(s.catalog).map((k) => { const v = sal.rates[k] ?? 0; return <tr key={k}><td><b>{s.catalog[k].name}</b></td><td>{s.catalog[k].unit}</td>
        <td className="r"><input key={v} className="input num" type="number" min={0} step={10} style={{ width: 110, textAlign: 'right' }} defaultValue={v} aria-label={`${s.catalog[k].name} rate`}
          onBlur={(e) => { const n = Math.max(0, Math.round(+e.target.value || 0)); if (n !== v) void attempt(act.setRate(sal.id, k, n), 'Rate updated'); }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} /></td>
        <td className="r num">{used[k] || 0}</td><td className="r num">{D.inr((used[k] || 0) * v)}</td></tr>; })}</tbody></table></div></Card>
    <p className="muted small">Experts log the products they use on each job. Rate changes apply to new bookings.</p>
  </>;
}

export function PartnerPayouts() {
  const { s, sal } = useSalonPage();
  if (!s || !sal) return <Loading />;
  const p = D.payable(s, 'salon', sal.id);
  return <>
    <PageHead title="Payouts & statements" sub="Space fees and product charges Arman owes you" />
    <div className="kpis"><Kpi icon="handCoins" label="Awaiting payout" value={D.inr(p.amount)} delta={`${p.open.length} completed services`} /><Kpi icon="coins" label="Paid to date" value={D.inr(p.history.reduce((a, h) => a + h.amount, 0))} delta={`${p.history.length} settlements`} /></div>
    <div className="grid g2">
      <Card flush title="Not yet settled">{p.open.length ? <div className="table-wrap"><table className="t"><thead><tr><th>Date</th><th>Service</th><th className="r">Space fee</th><th className="r">Products</th></tr></thead><tbody>{[...p.open].reverse().slice(0, 60).map((b) => <tr key={b.id}><td>{D.fmtDate(b.date, { day: 'numeric', month: 'short' })}<div className="cell-sub">{b.id}</div></td><td>{D.svc(b.serviceId, s)?.name}</td><td className="r num">{D.inr(b.split.salonFee)}</td><td className="r num">{D.inr(b.split.products)}</td></tr>)}</tbody></table></div> : <Empty title="All settled" text="Completed services appear here until Arman pays them out." />}</Card>
      <Card flush title="Statements">{p.history.length ? <table className="t"><tbody>{[...p.history].reverse().map((h) => <tr key={h.id}><td>{D.fmtDate(h.date)}<div className="cell-sub">{h.bookingIds.length} services</div></td><td className="r num"><b>{D.inr(h.amount)}</b></td><td><Badge s="paid" /></td></tr>)}</tbody></table> : <Empty title="No payouts yet" text="Arman settles completed services on a regular cycle." />}</Card>
    </div>
  </>;
}
