'use client';

import { useEffect, useMemo, useState } from 'react';
import * as D from '../lib/data';
import { act } from '../lib/actions';
import { useStore } from '../lib/hooks';
import { PageHead } from '../components/Shell';
import { attempt, Badge, Card, Drawer, Empty, Icon, initials, Kpi, Loading, Tabs, toast } from '../components/ui';
import { BookingTable, Drawers, DrawerState } from '../components/booking';

const last30 = (s: D.State) => { const t = D.today(), f = D.addDays(t, -29); return s.bookings.filter((b) => D.inRange(b, f, t) && b.status !== 'cancelled' && b.status !== 'noshow'); };
const useQueryFlag = (k: string) => { const [v, setV] = useState(false); useEffect(() => { setV(new URLSearchParams(window.location.search).get(k) === '1'); }, [k]); return [v, setV] as const; };

// =====================================================================
// Salon partners
// =====================================================================
export function AdminSalons() {
  const s = useStore();
  const [tab, setTab] = useState<'all' | 'approved' | 'pending' | 'suspended'>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useQueryFlag('new');
  if (!s) return <Loading />;
  const b30 = last30(s);
  const rows = s.salons.map((x) => { const mine = b30.filter((b) => b.salonId === x.id); return { x, n: mine.length, rev: mine.reduce((a, b) => a + b.split.price, 0), earn: mine.reduce((a, b) => a + b.split.salonFee + b.split.products, 0) }; });
  let list = rows.filter((r) => tab === 'all' || r.x.status === tab);
  if (q) { const k = q.toLowerCase(); list = list.filter((r) => (r.x.name + r.x.area + r.x.owner).toLowerCase().includes(k)); }
  const count = (st: string) => s.salons.filter((x) => x.status === st).length;
  const setStatus = (x: D.Salon, st: D.Salon['status']) => {
    if (st === 'suspended' && !window.confirm(`Suspend ${x.name}? Customers can no longer book its chairs. Existing bookings stay.`)) return;
    void attempt(act.updateSalon(x.id, { status: st }), `${x.name}: ${st}`);
  };
  return <>
    <PageHead title="Salon Partner Management" sub="Onboard, verify and manage partner salons across your network" tools={<button className="btn gold" onClick={() => setAdding(true)}><Icon name="plus" />Add partner</button>} />
    <div className="kpis">
      <Kpi icon="store" label="Total partners" value={s.salons.length} />
      <Kpi icon="clock" label="Pending approval" value={count('pending')} />
      <Kpi icon="checkCircle" label="Approved partners" value={count('approved')} />
      <Kpi icon="x" label="Suspended" value={count('suspended')} />
      <Kpi icon="chair" label="Total workstations" value={s.salons.reduce((a, x) => a + x.chairs.filter((c) => c.active).length, 0)} />
      <Kpi icon="rupee" label="Partner revenue (30 days)" value={D.inr(rows.reduce((a, r) => a + r.rev, 0))} />
    </div>
    <Card flush>
      <div style={{ padding: '14px 18px 0' }}>
        <Tabs label="Status" value={tab} onChange={setTab} options={[['all', 'All partners', s.salons.length], ['approved', 'Approved', count('approved')], ['pending', 'Pending approval', count('pending')], ['suspended', 'Suspended', count('suspended')]]} />
        <div className="filters"><label className="field grow"><span>Search</span><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Salon, owner or area" /></label></div>
      </div>
      {list.length ? <div className="table-wrap"><table className="t"><thead><tr><th>Salon partner</th><th>Location</th><th>Workstations</th><th className="r">Bookings (30d)</th><th className="r">Revenue (30d)</th><th className="r">Space fee</th><th>Status</th><th></th></tr></thead>
        <tbody>{list.map(({ x, n, rev }) => <tr key={x.id} className="click" onClick={() => setOpen(x.id)}>
          <td><div className="who"><span className="mono-av">{initials(x.name)}</span><div><b>{x.name}</b><div className="cell-sub">Owner: {x.owner || '—'}</div></div></div></td>
          <td>{x.area}<div className="cell-sub">Bhopal</div></td>
          <td>{x.chairs.filter((c) => c.active).length}<div className="cell-sub">{x.chairs.filter((c) => c.wash).length} with wash</div></td>
          <td className="r num">{n}</td><td className="r num">{D.inr(rev)}</td><td className="r num">{D.inr(x.seatFee)}</td>
          <td><Badge s={x.status} /></td>
          <td className="r" onClick={(e) => e.stopPropagation()}>{x.status === 'pending' ? <button className="btn sm gold" onClick={() => setStatus(x, 'approved')}>Approve</button> : x.status === 'approved' ? <button className="btn sm" onClick={() => setStatus(x, 'suspended')}>Suspend</button> : <button className="btn sm" onClick={() => setStatus(x, 'approved')}>Reactivate</button>}</td>
        </tr>)}</tbody></table></div> : <Empty title="No salons here" text="Change the filter or onboard a new partner salon." />}
      <div className="muted small" style={{ padding: '12px 18px' }}>Showing {list.length} of {s.salons.length} partners</div>
    </Card>
    {open && <SalonDrawer s={s} id={open} onClose={() => setOpen(null)} />}
    {adding && <NewSalonDrawer onClose={() => setAdding(false)} />}
  </>;
}

function SalonDrawer({ s, id, onClose }: { s: D.State; id: string; onClose: () => void }) {
  const x = D.salon(id, s);
  const [fee, setFee] = useState(String(x.seatFee)); const [o, setO] = useState(D.hm(x.open)); const [c, setC] = useState(D.hm(x.close));
  const [tab, setTab] = useState<'overview' | 'workstations' | 'products'>('overview');
  const mine = last30(s).filter((b) => b.salonId === id);
  const save = async () => {
    const op = D.toMin(o), cl = D.toMin(c);
    if (cl <= op) { toast('Closing time must be after opening time', 'bad'); return; }
    if (await attempt(act.updateSalon(id, { seatFee: Math.max(0, +fee || 0), open: op, close: cl }), 'Salon updated. New bookings use the new fee.')) onClose();
  };
  return <Drawer title={x.name} sub={x.address} onClose={onClose} footer={<>
    {x.status !== 'approved' ? <button className="btn gold" onClick={async () => { if (await attempt(act.updateSalon(id, { status: 'approved' }), 'Approved')) onClose(); }}>Approve</button>
      : <button className="btn" onClick={async () => { if (window.confirm('Suspend this salon?') && await attempt(act.updateSalon(id, { status: 'suspended' }), 'Suspended')) onClose(); }}>Suspend</button>}
    <button className="btn dark" onClick={save}>Save changes</button></>}>
    <div className="row spread" style={{ marginBottom: 12 }}><Badge s={x.status} /><span className="muted small">Partner ID {x.id}</span></div>
    <Tabs label="Section" value={tab} onChange={setTab} options={[['overview', 'Overview'], ['workstations', 'Workstations'], ['products', 'Products']]} />
    {tab === 'overview' && <div className="stack">
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
        <Kpi icon="calendar" label="Bookings (30d)" value={mine.length} />
        <Kpi icon="rupee" label="Revenue" value={D.inr(mine.reduce((a, b) => a + b.split.price, 0))} />
        <Kpi icon="handCoins" label="Owed" value={D.inr(D.payable(s, 'salon', id).amount)} />
      </div>
      <dl className="kv"><dt>Owner</dt><dd>{x.owner || '—'}{x.phone && <div className="cell-sub">{x.phone}</div>}</dd><dt>Facilities</dt><dd>{x.facilities.map((f) => <span key={f} className="chip">{f}</span>)}</dd><dt>Partner model</dt><dd>Space + equipment{Object.keys(x.rates).length ? ' + products' : ''}</dd></dl>
      <label className="field"><span>Space fee per booking (₹)</span><input className="input" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} /></label>
      <div className="grid g2"><label className="field"><span>Opens</span><input className="input" type="time" value={o} onChange={(e) => setO(e.target.value)} /></label><label className="field"><span>Closes</span><input className="input" type="time" value={c} onChange={(e) => setC(e.target.value)} /></label></div>
    </div>}
    {tab === 'workstations' && <table className="t"><tbody>{x.chairs.map((ch) => <tr key={ch.id}><td><b>{ch.name}</b></td><td>{ch.wash ? 'Wash station' : 'Basic'}</td><td><Badge s={ch.active ? 'active' : 'suspended'} label={ch.active ? 'Active' : 'Inactive'} /></td></tr>)}</tbody></table>}
    {tab === 'products' && <table className="t"><tbody>{Object.entries(x.rates).map(([k, v]) => <tr key={k}><td>{s.catalog[k]?.name}<div className="cell-sub">{s.catalog[k]?.unit}</div></td><td className="r num">{D.inr(v)}</td></tr>)}</tbody></table>}
  </Drawer>;
}

function NewSalonDrawer({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({ name: '', area: '', address: '', owner: '', phone: '', wash: '1', basic: '1', fee: '350' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const go = async () => {
    if (!f.name.trim() || !f.area.trim()) { toast('Enter the salon name and area', 'bad'); return; }
    const w = Math.max(0, +f.wash || 0), b = Math.max(0, +f.basic || 0);
    if (w + b < 1) { toast('Add at least one chair', 'bad'); return; }
    let n = 0;
    const chairs: D.Chair[] = [...Array(w)].map(() => ({ id: 'c' + (++n), name: `Chair ${D.pad(n)}`, wash: true, active: true }))
      .concat([...Array(b)].map(() => ({ id: 'c' + (++n), name: `Chair ${D.pad(n)}`, wash: false, active: true })));
    if (await attempt(act.addSalon({ name: f.name.trim(), area: f.area.trim(), address: f.address.trim() || f.area.trim(), owner: f.owner.trim(), phone: f.phone.trim(), status: 'pending', open: 600, close: 1260, seatFee: Math.max(0, +f.fee || 0), chairs, facilities: w ? ['Wash station'] : [] }), 'Salon added as pending approval')) onClose();
  };
  return <Drawer title="Onboard a partner salon" sub="Added as pending until you approve it" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn gold" onClick={go}>Add salon</button></>}>
    <div className="stack">
      {([['name', 'Salon name'], ['area', 'Area (e.g. Kolar Road)'], ['address', 'Full address'], ['owner', 'Owner name'], ['phone', 'Owner mobile']] as const).map(([k, l]) => <label key={k} className="field"><span>{l}</span><input className="input" value={f[k]} onChange={set(k)} /></label>)}
      <div className="grid g2"><label className="field"><span>Chairs with wash station</span><input className="input" type="number" min={0} value={f.wash} onChange={set('wash')} /></label><label className="field"><span>Basic chairs</span><input className="input" type="number" min={0} value={f.basic} onChange={set('basic')} /></label></div>
      <label className="field"><span>Space fee per booking (₹)</span><input className="input" type="number" min={0} value={f.fee} onChange={set('fee')} /></label>
    </div>
  </Drawer>;
}

// =====================================================================
// Experts
// =====================================================================
export function AdminExperts() {
  const s = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useQueryFlag('new');
  if (!s) return <Loading />;
  const b30 = last30(s);
  const rows = s.experts.map((x) => { const jobs = b30.filter((b) => b.expertId === x.id); const mins = jobs.reduce((a, b) => a + b.end - b.start, 0); return { x, n: jobs.length, load: Math.min(100, Math.round((mins / ((x.end - x.start) * 26)) * 100)), earn: jobs.filter((b) => b.status === 'completed').reduce((a, b) => a + b.split.expertPay + b.split.travel, 0) }; });
  const avgLoad = rows.length ? Math.round(rows.reduce((a, r) => a + r.load, 0) / rows.length) : 0;
  const skillName = (k: string) => s.services.find((v) => v.skill === k)?.name ?? k;
  return <>
    <PageHead title="Expert Management" sub="Manage hair experts, skills, availability and performance" tools={<button className="btn gold" onClick={() => setAdding(true)}><Icon name="plus" />Add expert</button>} />
    <div className="kpis">
      <Kpi icon="scissors" label="Total experts" value={s.experts.length} />
      <Kpi icon="checkCircle" label="Active experts" value={s.experts.filter((x) => x.status === 'active').length} />
      <Kpi icon="clock" label="On leave" value={s.experts.filter((x) => x.status === 'leave').length} />
      <Kpi icon="chart" label="Avg. booking load" value={`${avgLoad}%`} delta="Last 30 days" />
      <Kpi icon="star" label="Avg. rating" value={(s.experts.reduce((a, x) => a + x.rating, 0) / Math.max(1, s.experts.length)).toFixed(1)} />
    </div>
    <Card flush>
      <div className="table-wrap"><table className="t"><thead><tr><th>Expert</th><th>Skills & specialisation</th><th>Based in</th><th>Hours</th><th className="r">Jobs (30d)</th><th>Load</th><th className="r">Earnings (30d)</th><th>Status</th></tr></thead>
        <tbody>{rows.map(({ x, n, load, earn }) => <tr key={x.id} className="click" onClick={() => setOpen(x.id)}>
          <td><div className="who"><span className="mono-av">{initials(x.name)}</span><div><b>{x.name}</b><div className="cell-sub">★ {x.rating.toFixed(1)}{x.phone ? ` · ${x.phone}` : ''}</div></div></div></td>
          <td>{x.skills.map((k) => <span key={k} className="chip">{skillName(k)}</span>)}</td>
          <td>{x.home}</td><td className="num" style={{ whiteSpace: 'nowrap' }}>{D.hm12(x.start)}–{D.hm12(x.end)}</td>
          <td className="r num">{n}</td>
          <td style={{ minWidth: 110 }}><div className="row"><div className="bar-track grow"><div style={{ width: `${load}%` }} /></div><span className="small num">{load}%</span></div></td>
          <td className="r num">{D.inr(earn)}</td><td><Badge s={x.status} /></td></tr>)}</tbody></table></div>
    </Card>
    <p className="muted small">The booking engine only offers an expert for services in their skills, inside their hours, with {D.BUFFER} min between jobs at the same salon and 45 min when moving to another salon (₹{D.TRAVEL_FEE} travel paid).</p>
    {open && <ExpertDrawer s={s} id={open} onClose={() => setOpen(null)} />}
    {adding && <ExpertDrawer s={s} onClose={() => setAdding(false)} />}
  </>;
}

function ExpertDrawer({ s, id, onClose }: { s: D.State; id?: string; onClose: () => void }) {
  const x = id ? D.expert(id, s) : null;
  const skills = [...new Set(s.services.map((v) => v.skill))];
  const [f, setF] = useState({ name: x?.name ?? '', phone: x?.phone ?? '', home: x?.home ?? '', status: x?.status ?? 'active', start: D.hm(x?.start ?? 600), end: D.hm(x?.end ?? 1260), skills: x?.skills ?? [] as string[] });
  const go = async () => {
    if (!f.name.trim()) { toast('Enter the expert name', 'bad'); return; }
    if (!f.skills.length) { toast('Pick at least one skill', 'bad'); return; }
    if (D.toMin(f.end) <= D.toMin(f.start)) { toast('End time must be after start time', 'bad'); return; }
    const patch = { name: f.name.trim(), phone: f.phone.trim(), home: f.home.trim(), status: f.status as D.Expert['status'], start: D.toMin(f.start), end: D.toMin(f.end), skills: f.skills };
    if (await attempt(x ? act.updateExpert(x.id, patch) : act.addExpert(patch), x ? 'Expert saved' : 'Expert added')) onClose();
  };
  return <Drawer title={x ? x.name : 'Add expert'} sub={x ? `Based in ${x.home}` : 'New Arman expert'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn gold" onClick={go}>{x ? 'Save expert' : 'Add expert'}</button></>}>
    <div className="stack">
      {!x && <label className="field"><span>Full name</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>}
      <div className="grid g2"><label className="field"><span>Mobile</span><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label><label className="field"><span>Based in (area)</span><input className="input" value={f.home} onChange={(e) => setF({ ...f, home: e.target.value })} /></label></div>
      <label className="field"><span>Status</span><select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as D.Expert['status'] })}><option value="active">Working</option><option value="leave">On leave (no new bookings)</option></select></label>
      <div className="grid g2"><label className="field"><span>Starts</span><input className="input" type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></label><label className="field"><span>Ends</span><input className="input" type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></label></div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="muted small" style={{ fontWeight: 600, marginBottom: 6 }}>Skills (services this expert can be booked for)</legend>
        {skills.map((k) => <label key={k} className="row" style={{ padding: '5px 0' }}><input type="checkbox" checked={f.skills.includes(k)} onChange={(e) => setF({ ...f, skills: e.target.checked ? [...f.skills, k] : f.skills.filter((z) => z !== k) })} /> {s.services.filter((v) => v.skill === k).map((v) => v.name).join(', ')}</label>)}
      </fieldset>
    </div>
  </Drawer>;
}

// =====================================================================
// Customers (CRM) — built from booking history
// =====================================================================
type Tier = 'Platinum' | 'Gold' | 'Silver' | 'Regular';
const tierOf = (spend: number): Tier => (spend >= 40000 ? 'Platinum' : spend >= 20000 ? 'Gold' : spend >= 8000 ? 'Silver' : 'Regular');
const tierTone: Record<Tier, string> = { Platinum: 'gold', Gold: 'warn', Silver: 'info', Regular: '' };

export function AdminCustomers() {
  const s = useStore();
  const [tab, setTab] = useState<'all' | Tier>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [d, setD] = useState<DrawerState>(null);
  const customers = useMemo(() => {
    if (!s) return [];
    const m = new Map<string, { phone: string; name: string; list: D.Booking[] }>();
    for (const b of s.bookings) { if (!b.customer.phone) continue; const c = m.get(b.customer.phone) || { phone: b.customer.phone, name: b.customer.name, list: [] }; c.list.push(b); c.name = b.customer.name; m.set(b.customer.phone, c); }
    return [...m.values()].map((c) => {
      const done = c.list.filter((b) => b.status !== 'cancelled' && b.status !== 'noshow');
      const spend = done.reduce((a, b) => a + b.split.price, 0);
      const last = c.list.reduce((a, b) => (b.date > a ? b.date : a), '');
      const first = c.list.reduce((a, b) => (b.date < a ? b.date : a), '9999');
      const fav = new Map<string, number>(); done.forEach((b) => fav.set(b.serviceId, (fav.get(b.serviceId) || 0) + 1));
      return { ...c, spend, count: done.length, last, first, tier: tierOf(spend), fav: [...fav.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k) };
    }).sort((a, b) => b.spend - a.spend);
  }, [s, s && s.bookings.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s) return <Loading />;
  let list = customers.filter((c) => tab === 'all' || c.tier === tab);
  if (q) { const k = q.toLowerCase(); list = list.filter((c) => (c.name + c.phone).toLowerCase().includes(k)); }
  const f30 = D.addDays(D.today(), -29);
  const repeat = customers.filter((c) => c.count > 1).length;
  const sel = customers.find((c) => c.phone === open);
  return <>
    <PageHead title="Customer Management" sub="All customers, bookings, value and loyalty — built from booking history" />
    <div className="kpis">
      <Kpi icon="users" label="Total customers" value={customers.length} />
      <Kpi icon="userPlus" label="New (30 days)" value={customers.filter((c) => c.first >= f30).length} />
      <Kpi icon="heart" label="Repeat booking rate" value={`${customers.length ? Math.round((repeat / customers.length) * 100) : 0}%`} />
      <Kpi icon="rupee" label="Lifetime revenue" value={D.inr(customers.reduce((a, c) => a + c.spend, 0))} />
      <Kpi icon="crown" label="Loyalty members" value={customers.filter((c) => c.tier !== 'Regular').length} delta="Silver and above" />
    </div>
    <Card flush>
      <div style={{ padding: '14px 18px 0' }}>
        <Tabs label="Tier" value={tab} onChange={setTab} options={[['all', 'All customers', customers.length], ['Platinum', 'Platinum', customers.filter((c) => c.tier === 'Platinum').length], ['Gold', 'Gold', customers.filter((c) => c.tier === 'Gold').length], ['Silver', 'Silver', customers.filter((c) => c.tier === 'Silver').length], ['Regular', 'Regular', customers.filter((c) => c.tier === 'Regular').length]]} />
        <div className="filters"><label className="field grow"><span>Search</span><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or mobile number" /></label></div>
      </div>
      {list.length ? <div className="table-wrap"><table className="t"><thead><tr><th>Customer</th><th>Loyalty tier</th><th className="r">Total spend</th><th className="r">Bookings</th><th>Last visit</th><th>Preferred services</th></tr></thead>
        <tbody>{list.slice(0, 100).map((c) => <tr key={c.phone} className="click" onClick={() => setOpen(c.phone)}>
          <td><div className="who"><span className="mono-av">{initials(c.name)}</span><div><b>{c.name}</b><div className="cell-sub">+91 {c.phone}</div></div></div></td>
          <td><span className={`badge ${tierTone[c.tier]}`}>{c.tier}</span></td>
          <td className="r num">{D.inr(c.spend)}</td><td className="r num">{c.count}</td><td>{c.last ? D.fmtDate(c.last, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
          <td>{c.fav.slice(0, 2).map((k) => <span key={k} className="chip">{D.svc(k, s)?.name}</span>)}</td></tr>)}</tbody></table></div>
        : <Empty title="No customers yet" text="Customers appear here after their first booking." />}
    </Card>
    {sel && <Drawer title={sel.name} sub={`+91 ${sel.phone}`} onClose={() => setOpen(null)}>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <Kpi icon="calendar" label="Bookings" value={sel.count} /><Kpi icon="rupee" label="Lifetime spend" value={D.inr(sel.spend)} /><Kpi icon="crown" label="Tier" value={sel.tier} />
      </div>
      <dl className="kv" style={{ marginBottom: 16 }}><dt>Customer since</dt><dd>{D.fmtDate(sel.first, { day: 'numeric', month: 'short', year: 'numeric' })}</dd><dt>Favourite services</dt><dd>{sel.fav.slice(0, 3).map((k) => <span key={k} className="chip">{D.svc(k, s)?.name}</span>)}</dd></dl>
      <div className="card flush"><BookingTable s={s} list={[...sel.list].sort((a, b) => b.date.localeCompare(a.date))} cols={['when', 'service', 'salon', 'price', 'status']} onOpen={(id) => { setOpen(null); setD({ kind: 'booking', id }); }} /></div>
    </Drawer>}
    <Drawers s={s} d={d} setD={setD} date={D.today()} role="admin" />
  </>;
}

// =====================================================================
// Services & pricing
// =====================================================================
export function AdminServices() {
  const s = useStore();
  const [ref, setRef] = useState('');
  const [cat, setCat] = useState('All');
  if (!s) return <Loading />;
  const approved = s.salons.filter((x) => x.status === 'approved');
  const rs = D.salon(ref || approved[0]?.id || s.salons[0]?.id, s);
  const cats = ['All', ...new Set(s.services.map((v) => v.cat))];
  const list = s.services.filter((v) => cat === 'All' || v.cat === cat);
  const save = (v: D.Service, k: 'price' | 'expertPay', raw: string) => {
    const n = Math.max(0, Math.round(+raw || 0)); if (n === v[k]) return;
    void attempt(act.updateService(v.id, { [k]: n }), `${v.name}: ${k === 'price' ? 'price' : 'expert payout'} now ${D.inr(n)}`);
  };
  return <>
    <PageHead title="Services & Pricing" sub="Arman sets one price per service across every partner salon" />
    <div className="kpis">
      <Kpi icon="tag" label="Service categories" value={cats.length - 1} />
      <Kpi icon="scissors" label="Total services" value={s.services.length} />
      <Kpi icon="rupee" label="Average price" value={D.inr(s.services.reduce((a, v) => a + v.price, 0) / Math.max(1, s.services.length))} />
      <Kpi icon="store" label="Partner salons" value={approved.length} />
    </div>
    <Card flush>
      <div style={{ padding: '14px 18px 0' }}>
        <Tabs label="Category" value={cat} onChange={setCat} options={cats.map((c) => [c, c, c === 'All' ? s.services.length : s.services.filter((v) => v.cat === c).length] as [string, string, number])} />
        <div className="filters"><label className="field"><span>Show Arman share at</span><select className="input" value={rs?.id} onChange={(e) => setRef(e.target.value)}>{s.salons.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div>
      </div>
      <div className="table-wrap"><table className="t"><thead><tr><th>Service</th><th>Duration</th><th>Needs</th><th className="r">Customer price</th><th className="r">Expert payout</th><th className="r">Salon cost*</th><th className="r">Arman share*</th></tr></thead>
        <tbody>{list.map((v) => { const sp = rs ? D.split(v, rs, false) : null; return <tr key={v.id}>
          <td><b>{v.name}</b><div className="cell-sub">{v.desc}</div></td><td>{v.duration} min</td>
          <td>{v.wash ? 'Wash station' : 'Any chair'}{v.products.length > 0 && <div className="cell-sub">{v.products.map((p) => s.catalog[p.id]?.name).join(', ')}</div>}</td>
          <td className="r"><input key={v.price} className="input num" style={{ width: 110, textAlign: 'right' }} type="number" min={0} step={50} defaultValue={v.price} onBlur={(e) => save(v, 'price', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} aria-label={`${v.name} price`} /></td>
          <td className="r"><input key={v.expertPay} className="input num" style={{ width: 100, textAlign: 'right' }} type="number" min={0} step={50} defaultValue={v.expertPay} onBlur={(e) => save(v, 'expertPay', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} aria-label={`${v.name} expert payout`} /></td>
          <td className="r num">{sp ? D.inr(sp.salonFee + sp.products) : '—'}</td>
          <td className="r num" style={{ color: sp && sp.arman < 0 ? 'var(--bad)' : undefined }}><b>{sp ? D.inr(sp.arman) : '—'}</b>{sp && <div className="cell-sub">{Math.round((sp.arman / Math.max(1, v.price)) * 100)}%</div>}</td>
        </tr>; })}</tbody></table></div>
      <p className="muted small" style={{ padding: '0 18px 14px', margin: 0 }}>* At {rs?.name}: space fee {rs && D.inr(rs.seatFee)} plus that salon’s product rates, without travel. Changes apply to new bookings only; existing bookings keep their agreed price.</p>
    </Card>
  </>;
}
