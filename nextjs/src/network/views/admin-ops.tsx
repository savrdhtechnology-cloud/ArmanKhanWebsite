'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import * as D from '../lib/data';
import { useDay, useSessionState, useStore } from '../lib/hooks';
import { PageHead } from '../components/Shell';
import { Card, DateNav, Empty, Icon, initials, Kpi, Loading, Tabs } from '../components/ui';
import { BookingTable, Drawers, DrawerState, ScheduleGrid } from '../components/booking';

export function AdminLive() {
  const s = useStore();
  const [date, setDate] = useSessionState('admin-live-date', D.today());
  const [salonId, setSalonId] = useSessionState('admin-live-salon', 'all');
  const [d, setD] = useState<DrawerState>(null);
  useDay(date);
  if (!s) return <Loading />;
  const approved = s.salons.filter((x) => x.status === 'approved');
  const ids = salonId === 'all' ? approved.map((x) => x.id) : approved.some((x) => x.id === salonId) ? [salonId] : approved.map((x) => x.id);
  const day = s.bookings.filter((b) => b.date === date && ids.includes(b.salonId));
  const liveB = day.filter((b) => b.status !== 'cancelled' && b.status !== 'noshow');
  const holds = s.holds.filter((h) => h.date === date && h.expires > Date.now() && ids.includes(h.salonId)).length;
  const blocks = s.blocks.filter((k) => k.date === date && ids.includes(k.salonId)).length;
  const revenue = liveB.reduce((a, b) => a + b.split.price, 0);
  const experts = s.experts.map((x) => ({ x, jobs: liveB.filter((b) => b.expertId === x.id) }));

  return <>
    <PageHead title="Booking Operations" sub="Live booking calendar, seat allocation, expert assignment and real-time operations" />
    <div className="kpis">
      <Kpi icon="calendar" label={date === D.today() ? "Today's bookings" : 'Bookings'} value={liveB.length} />
      <Kpi icon="clock" label="In progress" value={liveB.filter((b) => b.status === 'checkedin' || b.status === 'inservice').length} />
      <Kpi icon="checkCircle" label="Completed" value={liveB.filter((b) => b.status === 'completed').length} />
      <Kpi icon="calendarCheck" label="Upcoming" value={liveB.filter((b) => b.status === 'confirmed').length} />
      <Kpi icon="lock" label="On hold (5 min)" value={holds} />
      <Kpi icon="x" label="Blocked slots" value={blocks} />
      <Kpi icon="rupee" label="Revenue" value={D.inr(revenue)} />
    </div>
    <Card>
      <div className="filters">
        <div className="field"><span>Date</span><DateNav date={date} onChange={setDate} /></div>
        <label className="field"><span>Salon</span><select className="input" value={salonId} onChange={(e) => setSalonId(e.target.value)}>
          <option value="all">All partner salons</option>{approved.map((x) => <option key={x.id} value={x.id}>{x.name}, {x.area}</option>)}</select></label>
        <div className="field" style={{ marginLeft: 'auto' }}><span>&nbsp;</span><Link className="btn" href="/network/admin/bookings"><Icon name="search" />Search bookings</Link></div>
      </div>
      {approved.length ? <ScheduleGrid s={s} salonIds={ids} date={date} role="admin"
        onSlot={(sid, chairId, start) => setD({ kind: 'new', salonId: sid, chairId, start })}
        onBooking={(id) => setD({ kind: 'booking', id })} onBlock={(id) => setD({ kind: 'block', id })} />
        : <Empty title="No approved salons yet" text="Approve a partner salon to start taking bookings."><Link className="btn gold" href="/network/admin/salons">Review salons</Link></Empty>}
      <p className="muted small" style={{ marginBottom: 0 }}>Click a green slot to book a walk-in or phone customer. Click a booking to check in, start, complete, reassign or cancel it.</p>
    </Card>
    <Card title="Expert availability" sub={D.fmtDate(date)} className="" >
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        {experts.map(({ x, jobs }) => <div key={x.id} className="who" style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 10 }}>
          <span className="mono-av">{initials(x.name)}</span>
          <div><b>{x.name}</b><div className="cell-sub">{x.status !== 'active' ? 'On leave' : `${jobs.length} jobs · ${Math.max(0, Math.round(((x.end - x.start) - jobs.reduce((a, b) => a + b.end - b.start, 0)) / 60))} h free`}</div></div>
        </div>)}
      </div>
    </Card>
    <Drawers s={s} d={d} setD={setD} date={date} role="admin" />
  </>;
}

type When = 'all' | 'today' | 'upcoming' | 'completed' | 'cancelled';
export function AdminBookings() {
  const s = useStore();
  const [when, setWhen] = useSessionState<When>('admin-bk-when', 'upcoming');
  const [salonF, setSalonF] = useState(''); const [expertF, setExpertF] = useState(''); const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [d, setD] = useState<DrawerState>(null);
  const t = D.today();
  const groups = useMemo(() => {
    if (!s) return null;
    const all = s.bookings;
    return {
      all, today: all.filter((b) => b.date === t),
      upcoming: all.filter((b) => b.date >= t && ['confirmed', 'checkedin', 'inservice'].includes(b.status)),
      completed: all.filter((b) => b.status === 'completed'),
      cancelled: all.filter((b) => b.status === 'cancelled' || b.status === 'noshow'),
    };
  }, [s, t, s && s.bookings.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s || !groups) return <Loading />;
  let list = groups[when];
  if (salonF) list = list.filter((b) => b.salonId === salonF);
  if (expertF) list = list.filter((b) => b.expertId === expertF);
  if (q) { const k = q.toLowerCase(); list = list.filter((b) => (b.id + b.customer.name + b.customer.phone).toLowerCase().includes(k)); }
  const asc = when === 'upcoming' || when === 'today';
  list = [...list].sort((a, b) => (asc ? 1 : -1) * (a.date + D.pad(a.start)).localeCompare(b.date + D.pad(b.start)));
  const per = 25, pages = Math.max(1, Math.ceil(list.length / per)), pg = Math.min(page, pages - 1);

  return <>
    <PageHead title="All Bookings" sub="Search, filter and manage every appointment across the network" tools={<Link className="btn gold" href="/network/admin/live"><Icon name="plus" />New booking</Link>} />
    <Card flush>
      <div style={{ padding: '14px 18px 0' }}>
        <Tabs label="Show" value={when} onChange={(v) => { setWhen(v); setPage(0); }} options={[['all', 'All', groups.all.length], ['today', 'Today', groups.today.length], ['upcoming', 'Upcoming', groups.upcoming.length], ['completed', 'Completed', groups.completed.length], ['cancelled', 'Cancelled', groups.cancelled.length]]} />
        <div className="filters">
          <label className="field grow"><span>Search</span><input className="input" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Name, mobile or booking ID" /></label>
          <label className="field"><span>Salon</span><select className="input" value={salonF} onChange={(e) => { setSalonF(e.target.value); setPage(0); }}><option value="">All salons</option>{s.salons.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="field"><span>Expert</span><select className="input" value={expertF} onChange={(e) => { setExpertF(e.target.value); setPage(0); }}><option value="">All experts</option>{s.experts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        </div>
      </div>
      {list.length ? <BookingTable s={s} list={list.slice(pg * per, pg * per + per)} cols={['id', 'when', 'customer', 'service', 'salon', 'expert', 'price', 'status']} onOpen={(id) => setD({ kind: 'booking', id })} />
        : <Empty title="No bookings match" text="Change the filters, or add a booking from the live schedule." />}
      <div className="row spread" style={{ padding: '12px 18px' }}>
        <span className="muted small">Showing {list.length ? pg * per + 1 : 0}–{Math.min(list.length, pg * per + per)} of {list.length} bookings</span>
        <div className="row"><button className="btn sm" disabled={pg === 0} onClick={() => setPage(pg - 1)}>‹ Previous</button><span className="small num">{pg + 1} / {pages}</span><button className="btn sm" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Next ›</button></div>
      </div>
    </Card>
    <Drawers s={s} d={d} setD={setD} date={t} role="admin" />
  </>;
}
