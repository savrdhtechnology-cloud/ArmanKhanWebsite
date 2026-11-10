'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import * as D from '../lib/data';
import { act } from '../lib/actions';
import { attempt, Badge, Drawer, initials, toast } from './ui';

const PX = 30; // px per 15 minutes
export type Role = 'admin' | 'partner' | 'expert';

/** Live seat timeline: one or more salons, chairs as rows, time across. */
export function ScheduleGrid({ s, salonIds, date, role, onSlot, onBooking, onBlock }: {
  s: D.State; salonIds: string[]; date: string; role: Role;
  onSlot: (salonId: string, chairId: string, start: number) => void; onBooking: (id: string) => void; onBlock: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const salons = salonIds.map((id) => D.salon(id, s)).filter(Boolean);
  const open = Math.min(...salons.map((x) => x.open)), close = Math.max(...salons.map((x) => x.close));
  const now = D.nowMin();
  const isToday = date === D.today();
  const showNow = isToday && now > open && now < close;
  const width = ((close - open) / D.SLOT) * PX;
  const x = (m: number) => ((m - open) / D.SLOT) * PX;
  const key = salonIds.join(',');
  useEffect(() => { if (ref.current) ref.current.scrollLeft = showNow ? Math.max(0, x(now) - 160) : 0; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, date]);
  if (!salons.length) return null;
  const heads: number[] = []; for (let t = open; t < close; t += 30) heads.push(t);
  const holds = s.holds.filter((h) => h.expires > Date.now() && h.date === date);
  const pastW = date < D.today() ? width : showNow ? x(now) : 0;
  const multi = salons.length > 1;

  return <>
    <div className="sched" ref={ref}>
      <div className="sched-grid" style={{ gridTemplateColumns: `auto ${width}px` }}>
        <div className="corner" />
        <div style={{ position: 'relative', height: 32, width, borderBottom: '1px solid var(--line)' }}>
          {heads.map((t) => <div key={t} className={`hd ${t % 60 ? 'half' : ''}`} style={{ position: 'absolute', left: x(t), width: PX * 2, top: 0 }}>{t % 60 ? '' : D.hm12(t).replace(':00', '')}</div>)}
        </div>
        {salons.flatMap((sal) => {
          const day = s.bookings.filter((b) => b.salonId === sal.id && b.date === date && b.status !== 'cancelled' && b.status !== 'noshow');
          const util = sal.chairs.filter((c) => c.active).length ? Math.round((day.reduce((a, b) => a + (b.end - b.start), 0) / (sal.chairs.filter((c) => c.active).length * (sal.close - sal.open))) * 100) : 0;
          const rows: ReactNode[] = [];
          if (multi) rows.push(<div className="group" key={sal.id + 'g'}>{sal.name}<small>{sal.area}</small></div>, <div className="group-fill" key={sal.id + 'gf'} style={{ width }}><span className="small muted" style={{ position: 'sticky', left: 12, display: 'inline-block', padding: '9px 0' }}>{sal.chairs.filter((c) => c.active).length} workstations · {util}% utilised</span></div>);
          for (const c of sal.chairs) {
            const free: number[] = [];
            if (c.active) for (let t = sal.open; t < sal.close; t += D.SLOT) {
              if (isToday && t + D.SLOT <= now) continue;
              if (date < D.today()) continue;
              if (!D.chairBusy(s, sal.id, c.id, date, t, t + D.SLOT - D.BUFFER)) free.push(t);
            }
            rows.push(
              <div className="lbl" key={sal.id + c.id + 'l'}><b>{c.name}</b><small>{c.wash ? 'With wash station' : 'Basic'}{c.active ? '' : ' · inactive'}</small></div>,
              <div className="lane" key={sal.id + c.id + 'r'} style={{ width }}>
                {sal.open > open && <div className="slot off" style={{ left: 0, width: x(sal.open) }} />}
                {sal.close < close && <div className="slot off" style={{ left: x(sal.close), width: width - x(sal.close) }} />}
                {pastW > 0 && <div className="past" style={{ width: pastW }} />}
                {c.active ? free.map((t) => <button key={t} className="slot" style={{ left: x(t) + 1, width: PX - 2 }} onClick={() => onSlot(sal.id, c.id, t)} aria-label={`${sal.name} ${c.name} free at ${D.hm12(t)}`} title={`${D.hm12(t)} · free`} />)
                  : <div className="slot off" style={{ left: 0, width }} />}
                {day.filter((b) => b.chairId === c.id).map((b) => {
                  const sv = D.svc(b.serviceId, s), ex = D.expert(b.expertId, s);
                  const cls = b.status === 'completed' ? 'done' : ['checkedin', 'inservice'].includes(b.status) ? 'live' : '';
                  const who = role === 'partner' || !b.customer.name ? `Expert: ${ex?.name.split(' ')[0] ?? ''}` : `${b.customer.name} · ${ex?.name.split(' ')[0] ?? ''}`;
                  return <button key={b.id} className={`blk booked ${cls}`} style={{ left: x(b.start), width: x(b.end) - x(b.start) }} onClick={() => onBooking(b.id)} aria-label={`${sv?.name} at ${D.hm12(b.start)}`}><b>{sv?.name}</b><span>{who}</span></button>;
                })}
                {holds.filter((h) => h.salonId === sal.id && h.chairId === c.id).map((h) => <div key={h.id} className="blk held" style={{ left: x(h.start), width: x(h.end) - x(h.start) }}><b>Held</b><span>{D.HOLD_MIN} min hold</span></div>)}
                {s.blocks.filter((k) => k.salonId === sal.id && k.chairId === c.id && k.date === date).map((k) => <button key={k.id} className="blk blocked" style={{ left: x(k.start), width: x(k.end) - x(k.start) }} onClick={() => onBlock(k.id)}><b>Blocked</b><span>{k.reason}</span></button>)}
                {showNow && <div className="now-line" style={{ left: x(now) }} />}
              </div>,
            );
          }
          return rows;
        })}
      </div>
    </div>
    <div className="sched-legend">
      <span><i style={{ background: 'var(--free)', boxShadow: 'inset 0 0 0 1px var(--free-line)' }} />Available</span>
      <span><i style={{ background: 'var(--held)' }} />Held (5 min)</span>
      <span><i style={{ background: 'var(--booked)' }} />Booked</span>
      <span><i style={{ background: 'var(--gold-grad)' }} />In salon now</span>
      <span><i style={{ background: '#6a655a' }} />Completed</span>
      <span><i style={{ background: 'var(--blocked)' }} />Blocked by salon</span>
    </div>
  </>;
}

const NEXT: Partial<Record<D.Status, [D.Status, string]>> = { confirmed: ['checkedin', 'Check in'], checkedin: ['inservice', 'Start service'], inservice: ['completed', 'Complete service'] };

export function BookingDrawer({ s, id, role, onClose }: { s: D.State; id: string; role: Role; onClose: () => void }) {
  const b = s.bookings.find((x) => x.id === id);
  const [re, setRe] = useState('');
  const [busy, setBusy] = useState(false);
  if (!b) return null;
  const sv = D.svc(b.serviceId, s), sal = D.salon(b.salonId, s), ex = D.expert(b.expertId, s), ch = D.chairOf(b, s);
  const sp = b.split;
  const canEdit = role === 'admin' && !['completed', 'cancelled', 'noshow'].includes(b.status);
  const free = canEdit ? s.experts.filter((x) => x.id !== b.expertId && x.status === 'active' && x.skills.includes(sv.skill) && D.expertFree(s, x.id, b.salonId, b.date, b.start, b.end, { bookingId: b.id }).ok) : [];
  const nx = NEXT[b.status];
  const go = async (p: Promise<string | null>, msg: string) => { setBusy(true); const ok = await attempt(p, msg); setBusy(false); if (ok) onClose(); };
  const setSt = (st: D.Status) => {
    if (st === 'cancelled' && !window.confirm('Cancel this booking? The chair and expert become free again.')) return;
    void go(act.setStatus(b.id, st), `${b.id}: ${D.STATUS_LABEL[st]}`);
  };
  return <Drawer title="Booking details" sub={`#${b.id} · ${D.fmtDate(b.date)} · ${D.hm12(b.start)}–${D.hm12(b.end)}`} onClose={onClose}
    footer={canEdit ? <>
      <button className="btn danger" disabled={busy} onClick={() => setSt('cancelled')}>Cancel booking</button>
      {b.status === 'confirmed' && <button className="btn" disabled={busy} onClick={() => setSt('noshow')}>Mark no-show</button>}
      {b.payment === 'pending' && <button className="btn" disabled={busy} onClick={() => go(act.markPaid(b.id), 'Payment recorded')}>Mark paid</button>}
      {nx && <button className="btn gold" disabled={busy} onClick={() => setSt(nx[0])}>{nx[1]}</button>}
    </> : undefined}>
    <div className="row spread" style={{ marginBottom: 16 }}>
      <div><div className="serif" style={{ fontSize: 20, fontWeight: 700 }}>{sv.name}</div><div className="muted small">{sv.duration} min · via {b.channel}</div></div>
      <Badge s={b.status} />
    </div>
    {role !== 'partner' && b.customer.name && <div className="who" style={{ marginBottom: 16 }}><span className="mono-av">{initials(b.customer.name)}</span><div><b>{b.customer.name}</b><div className="cell-sub">{b.customer.phone}</div></div></div>}
    <dl className="kv">
      <dt>Salon</dt><dd>{sal.name}<div className="cell-sub">{sal.area}</div></dd>
      <dt>Workstation</dt><dd>{ch?.name || b.chairId}</dd>
      <dt>Expert</dt><dd>{ex?.name}</dd>
      <dt>Timing</dt><dd>{D.hm12(b.start)} – {D.hm12(b.end)} + {D.BUFFER} min cleanup</dd>
      <dt>Products</dt><dd>{b.productsUsed.map((p) => `${s.catalog[p.id]?.name ?? p.id} × ${p.qty}`).join(', ') || 'None'}</dd>
      {role === 'partner' ? <><dt>Your space fee</dt><dd>{D.inr(sp.salonFee)}</dd><dt>Product charges</dt><dd>{D.inr(sp.products)}</dd></> : <>
        <dt>Customer price</dt><dd>{D.inr(sp.price)} <Badge s={b.payment} /></dd>
        <dt>Salon fee</dt><dd>{D.inr(sp.salonFee)}</dd><dt>Products</dt><dd>{D.inr(sp.products)}</dd>
        <dt>Expert payout</dt><dd>{D.inr(sp.expertPay)}{sp.travel ? ` + ${D.inr(sp.travel)} travel` : ''}</dd>
        <dt>Arman share</dt><dd>{D.inr(sp.arman)}</dd></>}
    </dl>
    {canEdit && <div className="field" style={{ marginTop: 18 }}><span>Assign / change expert</span>
      <div className="row">
        <select className="input" value={re || free[0]?.id || ''} onChange={(e) => setRe(e.target.value)} disabled={!free.length}>
          {free.length ? free.map((x) => <option key={x.id} value={x.id}>{x.name}</option>) : <option value="">No other qualified expert is free</option>}
        </select>
        <button className="btn" disabled={!free.length || busy} onClick={() => { const nid = re || free[0].id; void go(act.reassign(b.id, nid), `Assigned to ${D.expert(nid, s).name}`); }}>Assign</button>
      </div></div>}
  </Drawer>;
}

/** Admin walk-in / phone booking straight onto a chair. Re-validated on confirm. */
export function NewBookingDrawer({ s, salonId, chairId, date, start, onClose }: { s: D.State; salonId: string; chairId: string; date: string; start: number; onClose: () => void }) {
  const sal = D.salon(salonId, s); const ch = sal.chairs.find((c) => c.id === chairId)!;
  const services = s.services.filter((v) => !v.wash || ch.wash);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [expertId, setExpertId] = useState('');
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [pay, setPay] = useState<D.Payment>('pending');
  const [busy, setBusy] = useState(false);
  const v = D.svc(serviceId, s); const end = start + (v?.duration ?? 0);
  const ok = useMemo(() => !v ? [] : s.experts.filter((x) => x.status === 'active' && x.skills.includes(v.skill)).map((x) => ({ x, f: D.expertFree(s, x.id, salonId, date, start, end) })).filter((r) => r.f.ok),
    [s, v, salonId, date, start, end]);
  const chairState = end > sal.close ? 'closed' : D.chairBusy(s, salonId, chairId, date, start, end);
  const problem = chairState === 'closed' ? 'This service runs past closing time.' : chairState ? `Chair is ${chairState} for part of ${D.hm12(start)}–${D.hm12(end)}.` : !ok.length ? 'No qualified expert is free for this slot.' : '';
  const chosen = ok.find((r) => r.x.id === expertId)?.x.id ?? ok[0]?.x.id ?? '';
  const go = async () => {
    const digits = phone.replace(/\D/g, '');
    if (!name.trim()) { toast('Enter the customer name', 'bad'); return; }
    if (digits.length !== 10) { toast('Enter a 10-digit mobile number', 'bad'); return; }
    setBusy(true);
    const r = await act.adminBook({ serviceId, salonId, chairId, date, start, end, expertId: chosen, travel: false }, { name: name.trim(), phone: digits }, pay);
    setBusy(false);
    if (!r.ok) { toast(r.reason, 'bad'); return; }
    toast(`Booked ${r.booking.id}`); onClose();
  };
  return <Drawer title="New booking" sub={`${sal.name} · ${ch.name} · ${D.fmtDate(date)} at ${D.hm12(start)}`} onClose={onClose}
    footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn gold" disabled={!!problem || busy} onClick={go}>Confirm booking</button></>}>
    <div className="stack">
      <label className="field"><span>Service</span><select className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
        {services.map((x) => <option key={x.id} value={x.id}>{x.name} — {x.duration} min · {D.inr(x.price)}</option>)}</select></label>
      <label className="field"><span>Expert</span><select className="input" value={chosen} onChange={(e) => setExpertId(e.target.value)} disabled={!ok.length}>
        {ok.length ? ok.map((r) => <option key={r.x.id} value={r.x.id}>{r.x.name}{r.f.travel ? ' (travel ₹150)' : ''}</option>) : <option value="">No qualified expert free</option>}</select></label>
      {problem && <div className="holdbar">{problem}</div>}
      <label className="field"><span>Customer name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="Full name" /></label>
      <label className="field"><span>Mobile number</span><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="10-digit mobile" /></label>
      <label className="field"><span>Payment</span><select className="input" value={pay} onChange={(e) => setPay(e.target.value as D.Payment)}><option value="pending">Collect at salon</option><option value="paid">Already paid (UPI / card)</option></select></label>
      <p className="muted small" style={{ margin: 0 }}>{ch.wash ? '' : 'This chair has no wash station, so wash services are hidden. '}The engine re-checks the chair and expert the moment you confirm.</p>
    </div>
  </Drawer>;
}

/** Partner (or admin) blocks a chair for the salon’s own client or maintenance. */
export function BlockDrawer({ s, salonId, chairId, date, start, onClose }: { s: D.State; salonId: string; chairId: string; date: string; start: number; onClose: () => void }) {
  const sal = D.salon(salonId, s); const ch = sal.chairs.find((c) => c.id === chairId)!;
  const [len, setLen] = useState(60); const [reason, setReason] = useState('Salon own client'); const [busy, setBusy] = useState(false);
  const go = async () => {
    const end = Math.min(sal.close, start + len);
    const st = D.chairBusy(s, salonId, chairId, date, start, end - D.BUFFER);
    if (st) { toast(`Chair is already ${st} in that window`, 'bad'); return; }
    setBusy(true);
    if (await attempt(act.addBlock({ salonId, chairId, date, start, end, reason }), 'Chair blocked')) onClose();
    setBusy(false);
  };
  return <Drawer title="Block this chair" sub={`${ch.name} · ${D.fmtDate(date)} from ${D.hm12(start)}`} onClose={onClose}
    footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn gold" disabled={busy} onClick={go}>Block chair</button></>}>
    <div className="stack">
      <label className="field"><span>For how long</span><select className="input" value={len} onChange={(e) => setLen(+e.target.value)}>{[30, 60, 90, 120, 180, 240].map((m) => <option key={m} value={m}>{m >= 60 ? `${m / 60} hr` : `${m} min`}</option>)}</select></label>
      <label className="field"><span>Reason</span><select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>{['Salon own client', 'Maintenance', 'Staff break', 'Closed'].map((r) => <option key={r}>{r}</option>)}</select></label>
      <p className="muted small" style={{ margin: 0 }}>Arman customers cannot book this chair while it is blocked.</p>
    </div>
  </Drawer>;
}

export function BlockDetailDrawer({ s, id, canEdit, onClose }: { s: D.State; id: string; canEdit: boolean; onClose: () => void }) {
  const k = s.blocks.find((x) => x.id === id); if (!k) return null;
  return <Drawer title="Blocked time" sub={`${D.fmtDate(k.date)} · ${D.hm12(k.start)}–${D.hm12(k.end)}`} onClose={onClose}
    footer={<><button className="btn" onClick={onClose}>Close</button>{canEdit && <button className="btn danger" onClick={async () => { if (await attempt(act.removeBlock(id), 'Block removed')) onClose(); }}>Remove block</button>}</>}>
    <dl className="kv"><dt>Salon</dt><dd>{D.salon(k.salonId, s)?.name}</dd><dt>Chair</dt><dd>{D.salon(k.salonId, s)?.chairs.find((c) => c.id === k.chairId)?.name ?? k.chairId}</dd><dt>Reason</dt><dd>{k.reason}</dd></dl>
  </Drawer>;
}

export type Col = 'when' | 'id' | 'customer' | 'service' | 'salon' | 'chair' | 'expert' | 'price' | 'fee' | 'status';
const HEAD: Record<Col, string> = { when: 'Date & time', id: 'Booking ID', customer: 'Customer', service: 'Service', salon: 'Salon', chair: 'Workstation', expert: 'Expert', price: 'Amount', fee: 'Your earning', status: 'Status' };

export function BookingTable({ s, list, cols, onOpen }: { s: D.State; list: D.Booking[]; cols: Col[]; onOpen: (id: string) => void }) {
  return <div className="table-wrap"><table className="t">
    <thead><tr>{cols.map((c) => <th key={c} className={c === 'price' || c === 'fee' ? 'r' : ''}>{HEAD[c]}</th>)}</tr></thead>
    <tbody>{list.map((b) => {
      const sv = D.svc(b.serviceId, s), sal = D.salon(b.salonId, s), ex = D.expert(b.expertId, s);
      const cell: Record<Col, ReactNode> = {
        when: <><b>{D.fmtDate(b.date, { day: 'numeric', month: 'short' })}</b><div className="cell-sub">{D.hm12(b.start)}</div></>,
        id: <span className="num">{b.id}</span>,
        customer: <div className="who"><span className="mono-av">{initials(b.customer.name || '?')}</span><div>{b.customer.name}<div className="cell-sub">{b.customer.phone}</div></div></div>,
        service: <>{sv?.name}<div className="cell-sub">{sv?.duration} min</div></>,
        salon: <>{sal?.name}<div className="cell-sub">{D.chairOf(b, s)?.name}</div></>,
        chair: D.chairOf(b, s)?.name,
        expert: ex?.name,
        price: <>{D.inr(b.split.price)}<div className="cell-sub">{b.payment}</div></>,
        fee: D.inr(b.split.salonFee + b.split.products),
        status: <Badge s={b.status} />,
      };
      return <tr key={b.id} className="click" onClick={() => onOpen(b.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(b.id); }}>
        {cols.map((c) => <td key={c} className={c === 'price' || c === 'fee' ? 'r num' : ''}>{cell[c]}</td>)}
      </tr>;
    })}</tbody>
  </table></div>;
}

/** Drawer state shared by schedule and list pages. */
export type DrawerState = { kind: 'booking'; id: string } | { kind: 'block'; id: string } | { kind: 'new'; salonId: string; chairId: string; start: number } | { kind: 'blockNew'; salonId: string; chairId: string; start: number } | null;

export function Drawers({ s, d, setD, date, role }: { s: D.State; d: DrawerState; setD: (v: DrawerState) => void; date: string; role: Role }) {
  if (!d) return null;
  const close = () => setD(null);
  if (d.kind === 'booking') return <BookingDrawer s={s} id={d.id} role={role} onClose={close} />;
  if (d.kind === 'block') return <BlockDetailDrawer s={s} id={d.id} canEdit={role !== 'expert'} onClose={close} />;
  if (d.kind === 'new') return <NewBookingDrawer s={s} salonId={d.salonId} chairId={d.chairId} date={date} start={d.start} onClose={close} />;
  return <BlockDrawer s={s} salonId={d.salonId} chairId={d.chairId} date={date} start={d.start} onClose={close} />;
}
