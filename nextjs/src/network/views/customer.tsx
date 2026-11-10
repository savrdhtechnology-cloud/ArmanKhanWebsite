'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import * as D from '../lib/data';
import { act } from '../lib/actions';
import { useDay, useStore } from '../lib/hooks';
import { Badge, Empty, Icon, Loading, Logo, toast } from '../components/ui';

const STEPS = ['Service', 'Salon', 'Date & time', 'Expert', 'Confirm'];

function Top({ active, children }: { active: 'book' | 'find'; children: ReactNode }) {
  return <div className="cust">
    <header className="cust-top no-print"><div className="in">
      <Link href="/" aria-label="Arman Hair Studio website"><Logo height={36} /></Link>
      <nav aria-label="Customer"><Link href="/network/book" aria-current={active === 'book' ? 'page' : undefined}>Book</Link><Link href="/network/book/find" aria-current={active === 'find' ? 'page' : undefined}>My booking</Link></nav>
    </div></header>
    {children}
  </div>;
}

export function CustomerBook() {
  const s = useStore();
  const [step, setStep] = useState(1);
  const [cat, setCat] = useState('All');
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [salonId, setSalonId] = useState('any');
  const [date, setDate] = useState(D.today());
  const [hold, setHold] = useState<D.Hold | null>(null);
  const [expertPick, setExpertPick] = useState('auto');
  const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [pay, setPay] = useState<D.Payment>('pending');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<D.Booking | null>(null);
  const [, tick] = useState(0);
  useDay(step >= 3 ? date : null);
  useEffect(() => { if (!hold) return; const t = window.setInterval(() => tick((n) => n + 1), 15000); return () => window.clearInterval(t); }, [hold]);
  useEffect(() => { if (hold && hold.expires < Date.now()) { setHold(null); setStep(3); toast('Your 5-minute hold ran out. Choose a time again.', 'bad'); } });

  if (!s) return <Top active="book"><Loading /></Top>;
  const v = serviceId ? D.svc(serviceId, s) : null;
  const drop = () => { if (hold) { void act.releaseHold(hold.id); setHold(null); } };

  if (done) {
    const sv = D.svc(done.serviceId, s), sal = D.salon(done.salonId, s), ex = D.expert(done.expertId, s);
    return <Top active="book"><div className="cust-in"><div className="ticket">
      <div className="tk-head"><div style={{ color: '#e2c27d', fontWeight: 600 }}>Booking confirmed</div><h1 style={{ marginTop: 6 }}>{sv?.name}</h1><div style={{ color: '#b4ab98', marginTop: 4 }}>{D.fmtDate(done.date, { weekday: 'long', day: 'numeric', month: 'long' })} at {D.hm12(done.start)}</div></div>
      <div className="tk-body">
        <dl className="kv"><dt>Booking ID</dt><dd>{done.id}</dd><dt>Name</dt><dd>{done.customer.name}</dd><dt>Salon</dt><dd>{sal?.name}<div className="cell-sub">{sal?.address}</div></dd><dt>Expert</dt><dd>{ex?.name}</dd><dt>Duration</dt><dd>{sv?.duration} min</dd><dt>Amount</dt><dd>{D.inr(done.split.price)} <Badge s={done.payment} label={done.payment === 'paid' ? 'Paid' : 'Pay after service'} /></dd></dl>
        <p className="muted small">Please arrive 10 minutes early and show this booking ID at the salon counter. Save your booking ID and mobile number to view or cancel it later.</p>
        <div className="row wrap no-print"><button className="btn" onClick={() => window.print()}><Icon name="printer" />Print</button><Link className="btn" href="/network/book/find">My booking</Link>
          <button className="btn gold" onClick={() => { setDone(null); setStep(1); setServiceId(null); setSalonId('any'); setExpertPick('auto'); }}>Book another</button></div>
      </div></div></div></Top>;
  }

  const summary = <aside className="summary card">
    <h2 className="serif" style={{ fontSize: 19, marginBottom: 8 }}>Your booking</h2>
    {[['Service', v?.name ?? '—'], ['Duration', v ? `${v.duration} min` : '—'],
      ['Salon', hold ? D.salon(hold.salonId, s)?.name : salonId !== 'any' ? D.salon(salonId, s)?.name : step > 2 ? 'Any nearby' : '—'],
      ['When', hold ? `${D.fmtDate(hold.date)}, ${D.hm12(hold.start)}` : '—'],
      ['Expert', hold ? D.expert(hold.expertId, s)?.name : '—']].map(([k, val]) => <div key={k} className="li"><span className="muted">{k}</span><b style={{ textAlign: 'right' }}>{val}</b></div>)}
    <div className="li" style={{ fontSize: 17 }}><span>Total</span><b className="num">{v ? D.inr(v.price) : '—'}</b></div>
    {hold && <div className="holdbar" style={{ marginTop: 10 }}>Chair and expert held until {new Date(hold.expires).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</div>}
  </aside>;

  let body: ReactNode;
  if (step === 1) {
    const cats = ['All', ...new Set(s.services.map((x) => x.cat))];
    body = <>
      <div className="row spread wrap" style={{ marginBottom: 14 }}><h2 className="serif" style={{ fontSize: 22 }}>Select service</h2>
        <div className="seg" role="group" aria-label="Category">{cats.map((c) => <button key={c} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}</div></div>
      <div className="pick">{s.services.filter((x) => cat === 'All' || x.cat === cat).map((x) => <button key={x.id} className="opt" aria-pressed={serviceId === x.id} onClick={() => { setServiceId(x.id); setStep(2); }}>
        <span className="top"><span>{x.name}</span><span className="num">{D.inr(x.price)}</span></span><small>{x.desc}</small><small>{x.duration} min{x.wash ? ' · includes wash' : ''}</small></button>)}</div>
    </>;
  } else if (step === 2 && v) {
    body = <>
      <h2 className="serif" style={{ fontSize: 22, marginBottom: 14 }}>Choose a partner salon</h2>
      <div className="pick">
        <button className="opt" aria-pressed={salonId === 'any'} onClick={() => { setSalonId('any'); setStep(3); }}><span className="top"><span>Any partner salon</span><Icon name="pin" size={18} /></span><small>We pick the salon with the earliest free chair and expert.</small></button>
        {s.salons.filter((x) => x.status === 'approved').map((x) => { const fits = x.chairs.some((c) => c.active && (!v.wash || c.wash)); return <button key={x.id} className="opt" disabled={!fits} aria-pressed={salonId === x.id} onClick={() => { setSalonId(x.id); setStep(3); }}>
          <span className="top"><span>{x.name}</span></span><small>{x.address}</small><small>{fits ? x.facilities.join(' · ') : 'No wash station free for this service'}</small></button>; })}
      </div>
      <div className="row" style={{ marginTop: 18 }}><button className="btn" onClick={() => setStep(1)}>Back</button></div>
    </>;
  } else if (step === 3 && v) {
    const days = Array.from({ length: 10 }, (_, i) => D.addDays(D.today(), i));
    const opts = D.findOptions(s, { serviceId: v.id, date, salonId: salonId === 'any' ? undefined : salonId });
    const byStart = new Map<number, D.Option>(); opts.forEach((o) => { if (!byStart.has(o.start)) byStart.set(o.start, o); });
    const choose = async (start: number) => {
      const o = D.findOptions(s, { serviceId: v.id, date, salonId: salonId === 'any' ? undefined : salonId, from: start, to: start })[0];
      if (!o) { toast('That time was just taken. Pick another.', 'bad'); return; }
      setBusy(true); drop();
      const r = await act.hold(o);
      setBusy(false);
      if ('error' in r) { toast(r.error, 'bad'); return; }
      setHold(r.hold); setExpertPick('auto'); setStep(4);
    };
    body = <>
      <h2 className="serif" style={{ fontSize: 22, marginBottom: 12 }}>Pick a date and time</h2>
      <div className="days" role="group" aria-label="Date">{days.map((x) => <button key={x} className="day" aria-pressed={date === x} onClick={() => setDate(x)}><small>{x === D.today() ? 'Today' : D.fmtDate(x, { weekday: 'short' })}</small><b>{D.fmtDate(x, { day: 'numeric' })}</b><small>{D.fmtDate(x, { month: 'short' })}</small></button>)}</div>
      {[['Morning', 0, 720], ['Afternoon', 720, 1020], ['Evening', 1020, 1440]].map(([g, a, z]) => { const list = [...byStart.values()].filter((o) => o.start >= (a as number) && o.start < (z as number)); return list.length ? <div key={g as string}>
        <h3 className="muted" style={{ fontSize: 13, margin: '16px 0 8px' }}>{g}</h3>
        <div className="times">{list.map((o) => <button key={o.start} className="time" disabled={busy} onClick={() => choose(o.start)}>{D.hm12(o.start)}{salonId === 'any' && <small>{D.salon(o.salonId, s)?.area}</small>}</button>)}</div></div> : null; })}
      {!byStart.size && <Empty title="No free slots on this day" text={salonId === 'any' ? 'Every qualified expert or suitable chair is taken. Try another date.' : 'Try another date, or choose “Any partner salon”.'} />}
      <p className="muted small" style={{ marginTop: 14 }}>Only times where a suitable chair and a qualified Arman expert are both free are shown.</p>
      <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={() => setStep(2)}>Back</button></div>
    </>;
  } else if (step === 4 && v && hold) {
    const sal = D.salon(hold.salonId, s);
    const cands = s.experts.filter((x) => x.status === 'active' && x.skills.includes(v.skill) && (x.id === hold.expertId || D.expertFree(s, x.id, hold.salonId, hold.date, hold.start, hold.end, { holdId: hold.id }).ok));
    const pick = async (id: string) => {
      if (id === 'auto' || id === hold.expertId) { setExpertPick(id); return; }
      setBusy(true); const err = await act.changeHoldExpert(hold, id); setBusy(false);
      if (err) { toast(err, 'bad'); return; }
      setHold({ ...hold, expertId: id }); setExpertPick(id);
    };
    body = <>
      <h2 className="serif" style={{ fontSize: 22, marginBottom: 4 }}>Choose your expert</h2>
      <p className="muted" style={{ margin: '0 0 14px' }}>{sal?.name}, {sal?.area} · {D.fmtDate(hold.date)} at {D.hm12(hold.start)}</p>
      <div className="pick">
        <button className="opt" aria-pressed={expertPick === 'auto'} onClick={() => pick('auto')}><span className="top"><span>Best available</span><span className="badge gold">Recommended</span></span><small>{D.expert(hold.expertId, s)?.name}, already nearby and free.</small></button>
        {cands.map((x) => <button key={x.id} className="opt" disabled={busy} aria-pressed={expertPick === x.id} onClick={() => pick(x.id)}><span className="top"><span>{x.name}</span><span className="num">★ {x.rating.toFixed(1)}</span></span>
          <small>{[...new Set(x.skills.map((k) => s.services.find((y) => y.skill === k)?.cat).filter(Boolean))].join(', ')} specialist</small></button>)}
      </div>
      <div className="row" style={{ marginTop: 18 }}><button className="btn" onClick={() => { drop(); setStep(3); }}>Back</button><button className="btn gold" onClick={() => setStep(5)}>Continue</button></div>
    </>;
  } else if (step === 5 && v && hold) {
    const confirmIt = async () => {
      const digits = phone.replace(/\D/g, '');
      if (name.trim().length < 2) { toast('Enter your name', 'bad'); return; }
      if (digits.length !== 10) { toast('Enter a 10-digit mobile number', 'bad'); return; }
      setBusy(true);
      const r = await act.confirmHold(hold, { name: name.trim(), phone: digits }, pay);
      setBusy(false);
      if (!r.ok) { toast(r.reason, 'bad'); setHold(null); setStep(3); return; }
      setHold(null); setDone(r.booking);
    };
    body = <>
      <h2 className="serif" style={{ fontSize: 22, marginBottom: 14 }}>Your details</h2>
      <div className="grid g2">
        <label className="field"><span>Full name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
        <label className="field"><span>Mobile number</span><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" /></label>
      </div>
      <h3 className="serif" style={{ fontSize: 18, margin: '18px 0 10px' }}>Payment</h3>
      <div className="pick">
        <button className="opt" aria-pressed={pay === 'pending'} onClick={() => setPay('pending')}><span className="top">Pay after service</span><small>Pay Arman by UPI, card or cash at the salon. Invoice is shared on WhatsApp.</small></button>
        {!D.REMOTE && <button className="opt" aria-pressed={pay === 'paid'} onClick={() => setPay('paid')}><span className="top">Pay online now</span><small>Demo only: online payment is connected in the next phase.</small></button>}
      </div>
      <p className="muted small" style={{ margin: '14px 0 0' }}>Free cancellation up to 2 hours before your appointment.</p>
      <div className="row" style={{ marginTop: 18 }}><button className="btn" onClick={() => setStep(4)}>Back</button><button className="btn gold lg" disabled={busy} onClick={confirmIt}>Confirm booking</button></div>
    </>;
  } else {
    body = <Empty title="Start your booking" text="Pick a service to begin."><button className="btn gold" onClick={() => setStep(1)}>Choose a service</button></Empty>;
  }

  return <Top active="book">
    <section className="cust-hero"><div className="in"><h1>Book your hair transformation</h1><p>Arman Hair Studio experts, at a partner salon near you in Bhopal.</p></div></section>
    <div className="cust-in">
      <ol className="steps">{STEPS.map((n, i) => <li key={n} className={i + 1 < step ? 'done' : i + 1 === step ? 'cur' : ''} aria-current={i + 1 === step ? 'step' : undefined}><b>{i + 1 < step ? '✓' : i + 1}</b><span>{n}</span></li>)}</ol>
      <div className="book-layout"><section className="card">{body}</section>{summary}</div>
    </div>
  </Top>;
}

export function CustomerFind() {
  const s = useStore();
  const [id, setId] = useState(''); const [phone, setPhone] = useState('');
  const [found, setFound] = useState<D.Booking | null | 'none'>(null);
  const [busy, setBusy] = useState(false);
  const find = async () => {
    const digits = phone.replace(/\D/g, '');
    if (!id.trim() || digits.length !== 10) { toast('Enter your booking ID and 10-digit mobile number', 'bad'); return; }
    setBusy(true);
    try { setFound((await act.findBooking(id.trim(), digits)) ?? 'none'); } catch (e) { toast((e as Error).message, 'bad'); }
    setBusy(false);
  };
  const cancel = async () => {
    if (!found || found === 'none' || !window.confirm('Cancel this appointment?')) return;
    const err = await act.cancelMine(found.id, phone.replace(/\D/g, ''));
    if (err) { toast(err, 'bad'); return; }
    toast('Booking cancelled'); setFound({ ...found, status: 'cancelled' });
  };
  const canCancel = found && found !== 'none' && found.status === 'confirmed' && (found.date > D.today() || (found.date === D.today() && found.start - D.nowMin() > 120));
  return <Top active="find"><div className="cust-in" style={{ maxWidth: 640 }}>
    <h1 className="serif" style={{ fontSize: 30, marginBottom: 16 }}>Find my booking</h1>
    <div className="card stack">
      <div className="grid g2"><label className="field"><span>Booking ID</span><input className="input" value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. AHS-1042" /></label>
        <label className="field"><span>Mobile number</span><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="10-digit mobile" onKeyDown={(e) => { if (e.key === 'Enter') void find(); }} /></label></div>
      <div><button className="btn gold" disabled={busy || !s} onClick={find}>Show booking</button></div>
    </div>
    {found === 'none' && <div className="card" style={{ marginTop: 16 }}><Empty title="No booking found" text="Check the booking ID and the mobile number you booked with." /></div>}
    {found && found !== 'none' && s && <div className="card" style={{ marginTop: 16 }}>
      <div className="row spread" style={{ marginBottom: 12 }}><h2 className="serif" style={{ fontSize: 21 }}>{D.svc(found.serviceId, s)?.name}</h2><Badge s={found.status} /></div>
      <dl className="kv"><dt>Booking ID</dt><dd>{found.id}</dd><dt>When</dt><dd>{D.fmtDate(found.date, { weekday: 'long', day: 'numeric', month: 'long' })}, {D.hm12(found.start)}</dd><dt>Salon</dt><dd>{D.salon(found.salonId, s)?.name}<div className="cell-sub">{D.salon(found.salonId, s)?.address}</div></dd><dt>Expert</dt><dd>{D.expert(found.expertId, s)?.name}</dd><dt>Amount</dt><dd>{D.inr(found.split.price)}</dd></dl>
      {canCancel && <div style={{ marginTop: 14 }}><button className="btn danger" onClick={cancel}>Cancel booking</button></div>}
    </div>}
  </div></Top>;
}
