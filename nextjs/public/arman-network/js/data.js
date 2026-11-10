// Arman Partner Network — demo data store (Phase 1, UI only).
// Everything lives in localStorage so a booking made in one portal shows up in all others.
// Phase 2 swaps these functions for Supabase queries; the shapes below are the target schema.

const KEY = 'arman-network-v1';

export const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => toISO(new Date());
export const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return toISO(d); };
export const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const hm12 = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}:${pad(mm)} ${h < 12 ? 'AM' : 'PM'}`; };
export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

const SERVICES = [
  { id: 'cut', name: 'Hair Cut & Style', cat: 'Cut', duration: 60, price: 700, wash: true, skill: 'cut', products: [], expertPay: 300, desc: 'Consultation, wash, cut and styling' },
  { id: 'beard', name: 'Beard & Grooming', cat: 'Cut', duration: 30, price: 400, wash: false, skill: 'beard', products: [], expertPay: 180, desc: 'Beard shaping, trim and hot towel' },
  { id: 'colour', name: 'Hair Colour', cat: 'Colour', duration: 120, price: 2800, wash: true, skill: 'colour', products: [{ id: 'loreal', qty: 1 }], expertPay: 800, desc: 'Global or root touch-up colour' },
  { id: 'keratin', name: 'Keratin Treatment', cat: 'Treatment', duration: 150, price: 4500, wash: true, skill: 'keratin', products: [{ id: 'keratin-kit', qty: 1 }], expertPay: 1200, desc: 'Frizz control and smooth finish' },
  { id: 'spa', name: 'Hair Spa', cat: 'Treatment', duration: 60, price: 1200, wash: true, skill: 'spa', products: [{ id: 'spa-cream', qty: 1 }], expertPay: 400, desc: 'Nourishment and scalp care' },
  { id: 'rebond', name: 'Rebonding', cat: 'Treatment', duration: 180, price: 5500, wash: true, skill: 'rebond', products: [{ id: 'rebond-kit', qty: 1 }], expertPay: 1500, desc: 'Permanent straightening' },
  { id: 'bridal', name: 'Bridal Styling', cat: 'Styling', duration: 120, price: 6000, wash: false, skill: 'bridal', products: [{ id: 'styling', qty: 1 }], expertPay: 2000, desc: 'Bridal or occasion hair styling' },
  { id: 'olaplex', name: 'Olaplex Add-on', cat: 'Treatment', duration: 30, price: 900, wash: true, skill: 'colour', products: [{ id: 'olaplex', qty: 1 }], expertPay: 250, desc: 'Bond repair with any colour service' },
];

const EXPERTS = [
  { id: 'rohan', name: 'Rohan Verma', phone: '98260 11001', skills: ['cut', 'beard', 'spa'], home: 'MP Nagar', start: 600, end: 1260, status: 'active', rating: 4.8 },
  { id: 'asif', name: 'Asif Khan', phone: '98260 11002', skills: ['colour', 'rebond', 'keratin', 'cut'], home: 'Kolar Road', start: 600, end: 1260, status: 'active', rating: 4.9 },
  { id: 'neha', name: 'Neha Sharma', phone: '98260 11003', skills: ['keratin', 'spa', 'bridal', 'colour'], home: 'Arera Colony', start: 660, end: 1260, status: 'active', rating: 4.7 },
  { id: 'sameer', name: 'Sameer Ali', phone: '98260 11004', skills: ['cut', 'beard', 'rebond'], home: 'New Market', start: 600, end: 1200, status: 'active', rating: 4.6 },
  { id: 'pooja', name: 'Pooja Rathore', phone: '98260 11005', skills: ['bridal', 'colour', 'spa', 'keratin'], home: 'MP Nagar', start: 660, end: 1260, status: 'leave', rating: 4.8 },
];

const PRODUCT_CATALOG = {
  loreal: { name: "L'Oréal colour tube", unit: '100 ml' },
  'keratin-kit': { name: 'Keratin kit', unit: 'per service' },
  'spa-cream': { name: 'Spa cream', unit: '50 g' },
  'rebond-kit': { name: 'Rebonding kit', unit: 'per service' },
  styling: { name: 'Styling kit', unit: 'per service' },
  olaplex: { name: 'Olaplex No.1', unit: '15 ml' },
};

const chair = (id, name, wash, active = true) => ({ id, name, wash, active });
const SALONS = [
  { id: 'mantra', name: 'Style Mantra', area: 'MP Nagar', address: 'Zone 2, MP Nagar, Bhopal', owner: 'Sunil Mehta', phone: '98930 22001', status: 'approved', open: 600, close: 1260, seatFee: 350,
    chairs: [chair('c1', 'Chair 01', true), chair('c2', 'Chair 02', true), chair('c3', 'Chair 03', false), chair('c4', 'Chair 04', false, false)],
    facilities: ['Wash station', 'Steamer', 'AC', 'Parking'],
    rates: { loreal: 550, 'keratin-kit': 1200, 'spa-cream': 250, 'rebond-kit': 1500, styling: 300, olaplex: 350 } },
  { id: 'glow', name: 'Glow Studio', area: 'Kolar Road', address: 'Near Sarvadharm, Kolar Road, Bhopal', owner: 'Ritu Jain', phone: '98930 22002', status: 'approved', open: 600, close: 1230, seatFee: 300,
    chairs: [chair('c1', 'Chair 01', true), chair('c2', 'Chair 02', false), chair('c3', 'Chair 03', true)],
    facilities: ['Wash station', 'Hood dryer', 'AC'],
    rates: { loreal: 520, 'keratin-kit': 1150, 'spa-cream': 230, 'rebond-kit': 1450, styling: 280, olaplex: 340 } },
  { id: 'shine', name: 'Shine On Salon', area: 'Arera Colony', address: 'E-4, Arera Colony, Bhopal', owner: 'Faizal Qureshi', phone: '98930 22003', status: 'approved', open: 660, close: 1260, seatFee: 400,
    chairs: [chair('c1', 'Chair 01', true), chair('c2', 'Chair 02', true)],
    facilities: ['Wash station', 'Bridal room', 'AC', 'Parking'],
    rates: { loreal: 580, 'keratin-kit': 1250, 'spa-cream': 260, 'rebond-kit': 1550, styling: 320, olaplex: 360 } },
  { id: 'urban', name: 'Urban Edge', area: 'New Market', address: 'TT Nagar, New Market, Bhopal', owner: 'Karan Patel', phone: '98930 22004', status: 'pending', open: 600, close: 1260, seatFee: 320,
    chairs: [chair('c1', 'Chair 01', true), chair('c2', 'Chair 02', false)],
    facilities: ['Wash station', 'AC'],
    rates: { loreal: 540, 'keratin-kit': 1200, 'spa-cream': 240, 'rebond-kit': 1500, styling: 300, olaplex: 340 } },
];

export const TRAVEL_FEE = 150;          // paid to expert when they move between salons
export const BUFFER = 15;               // cleanup minutes after every service
export const HOLD_MIN = 5;              // seat + expert hold while customer confirms
export const SLOT = 15;                 // grid step

const FIRST = ['Vikram', 'Neha', 'Pooja', 'Aman', 'Riya', 'Kunal', 'Sana', 'Arjun', 'Meera', 'Imran', 'Tanya', 'Harsh', 'Ayesha', 'Rahul', 'Divya'];
const LAST = ['S.', 'P.', 'R.', 'K.', 'M.', 'J.', 'T.', 'B.'];

let rng = 7;
const rand = () => { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; };

function seed() {
  const state = { services: SERVICES, experts: EXPERTS, salons: SALONS, catalog: PRODUCT_CATALOG, bookings: [], blocks: [], holds: [], settlements: [], seq: 1040 };
  const t = today();
  // past 13 days completed + today + next 6 days
  for (let d = -29; d <= 6; d++) {
    const date = addDays(t, d);
    const n = d < 0 ? 4 + Math.floor(rand() * 5) : d === 0 ? 7 : 2 + Math.floor(rand() * 4);
    for (let i = 0; i < n; i++) {
      const svc = SERVICES[Math.floor(rand() * 7)];
      const salon = SALONS[Math.floor(rand() * 3)];
      const start = salon.open + Math.floor(rand() * ((salon.close - salon.open - svc.duration) / 15)) * 15;
      const opt = findOptions(state, { serviceId: svc.id, date, salonId: salon.id, from: start, to: start, ignoreHolds: true })[0];
      if (!opt) continue;
      const cust = { name: `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`, phone: `9${Math.floor(100000000 + rand() * 899999999)}` };
      const b = makeBooking(state, opt, cust, 'online');
      if (d < 0) { b.status = rand() < 0.08 ? 'cancelled' : 'completed'; b.payment = b.status === 'completed' ? 'paid' : 'refunded'; }
      else if (d === 0 && start + svc.duration < nowMin()) { b.status = 'completed'; b.payment = 'paid'; }
      state.bookings.push(b);
    }
  }
  state.blocks.push({ id: 'blk1', salonId: 'mantra', chairId: 'c3', date: t, start: 960, end: 1020, reason: 'Salon own client' });
  return state;
}

export function nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }

let cache = null;
const listeners = new Set();
export function db() {
  if (cache) return cache;
  try { const raw = localStorage.getItem(KEY); if (raw) cache = JSON.parse(raw); } catch { /* storage blocked */ }
  if (!cache) { cache = seed(); save(); }
  return cache;
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* ignore */ } listeners.forEach((f) => f()); }
export function onChange(f) { listeners.add(f); return () => listeners.delete(f); }
export function refresh() { listeners.forEach((f) => f()); }
export function reload() { cache = null; db(); listeners.forEach((f) => f()); }
export function resetDemo() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } cache = null; db(); save(); }

export const svc = (id, s = db()) => s.services.find((x) => x.id === id);
export const salon = (id, s = db()) => s.salons.find((x) => x.id === id);
export const expert = (id, s = db()) => s.experts.find((x) => x.id === id);
export const chairOf = (b, s = db()) => salon(b.salonId, s)?.chairs.find((c) => c.id === b.chairId);

// ---------- Revenue split (customer price → salon, products, expert, travel, Arman) ----------
export function split(state, service, salonObj, travel) {
  const products = service.products.reduce((sum, p) => sum + (salonObj.rates[p.id] || 0) * p.qty, 0);
  const salonFee = salonObj.seatFee;
  const expertPay = service.expertPay;
  const travelFee = travel ? TRAVEL_FEE : 0;
  const arman = service.price - salonFee - products - expertPay - travelFee;
  return { price: service.price, salonFee, products, expertPay, travel: travelFee, arman };
}

// ---------- Booking engine ----------
const live = (b) => b.status !== 'cancelled';
const overlap = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;

function activeHolds(state) { const now = Date.now(); state.holds = state.holds.filter((h) => h.expires > now); return state.holds; }

export function chairBusy(state, salonId, chairId, date, start, end, ignore = {}) {
  const e = end + BUFFER;
  if (state.bookings.some((b) => live(b) && b.id !== ignore.bookingId && b.salonId === salonId && b.chairId === chairId && b.date === date && overlap(start, e, b.start, b.end + BUFFER))) return 'booked';
  if (state.blocks.some((k) => k.salonId === salonId && k.chairId === chairId && k.date === date && overlap(start, e, k.start, k.end))) return 'blocked';
  if (!ignore.holds && activeHolds(state).some((h) => h.id !== ignore.holdId && h.salonId === salonId && h.chairId === chairId && h.date === date && overlap(start, e, h.start, h.end + BUFFER))) return 'held';
  return null;
}

// returns { ok, travel } — expert must be free, including travel gap if previous/next job is at another salon
export function expertFree(state, expertId, salonId, date, start, end, ignore = {}) {
  const x = expert(expertId, state);
  if (!x || x.status !== 'active' || start < x.start || end > x.end) return { ok: false };
  const jobs = [
    ...state.bookings.filter((b) => live(b) && b.id !== ignore.bookingId && b.expertId === expertId && b.date === date),
    ...(ignore.holds ? [] : activeHolds(state).filter((h) => h.id !== ignore.holdId && h.expertId === expertId && h.date === date)),
  ];
  for (const j of jobs) {
    const gap = j.salonId === salonId ? BUFFER : 30 + BUFFER;
    if (overlap(start - gap, end + gap, j.start, j.end)) return { ok: false };
  }
  // travel allowance when the expert comes from a different salon (or from home in another area)
  const prev = jobs.filter((j) => j.end <= start).sort((a, b) => b.end - a.end)[0];
  const travel = prev ? prev.salonId !== salonId : x.home !== salon(salonId, state).area;
  return { ok: true, travel };
}

/**
 * Find bookable options: every (salon, chair, expert, start) that satisfies the service's
 * facility needs, salon hours, chair availability and expert skill + availability.
 */
export function findOptions(state, { serviceId, date, salonId, expertId, from = 0, to = 1440, ignoreHolds = false }) {
  const s = svc(serviceId, state);
  if (!s) return [];
  const out = [];
  const salons = state.salons.filter((x) => x.status === 'approved' && (!salonId || x.id === salonId));
  const experts = state.experts.filter((x) => x.status === 'active' && x.skills.includes(s.skill) && (!expertId || x.id === expertId));
  const minStart = date === today() && !ignoreHolds ? Math.ceil((nowMin() + 30) / SLOT) * SLOT : 0;
  for (const sal of salons) {
    for (let t = Math.max(sal.open, from, minStart); t + s.duration <= sal.close && t <= to; t += SLOT) {
      const end = t + s.duration;
      const ch = sal.chairs.find((c) => c.active && (!s.wash || c.wash) && !chairBusy(state, sal.id, c.id, date, t, end, { holds: ignoreHolds }));
      if (!ch) continue;
      const ranked = experts.map((x) => ({ x, f: expertFree(state, x.id, sal.id, date, t, end, { holds: ignoreHolds }) })).filter((r) => r.f.ok)
        .sort((a, b) => (a.f.travel - b.f.travel) || (b.x.rating - a.x.rating));
      if (!ranked.length) continue;
      out.push({ serviceId, date, salonId: sal.id, chairId: ch.id, start: t, end, expertId: ranked[0].x.id, travel: ranked[0].f.travel, alternatives: ranked.map((r) => r.x.id) });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

export function hold(state, opt) {
  const h = { ...opt, id: 'H' + Date.now(), expires: Date.now() + HOLD_MIN * 60000 };
  delete h.alternatives;
  state.holds.push(h); save();
  return h;
}
export function releaseHold(state, id) { state.holds = state.holds.filter((h) => h.id !== id); save(); }

export function makeBooking(state, opt, customer, channel) {
  const s = svc(opt.serviceId, state), sal = salon(opt.salonId, state);
  return {
    id: 'AHS-' + (state.seq++), serviceId: opt.serviceId, salonId: opt.salonId, chairId: opt.chairId, expertId: opt.expertId,
    date: opt.date, start: opt.start, end: opt.end, customer, channel, status: 'confirmed', payment: 'pending',
    productsUsed: s.products.map((p) => ({ ...p })), split: split(state, s, sal, opt.travel), createdAt: Date.now(),
  };
}

/** Atomic confirm: re-check chair + expert against everything except our own hold, then write. */
export function confirm(state, holdOrOpt, customer, channel = 'online', payment = 'pending') {
  const ig = { holdId: holdOrOpt.id };
  const busy = chairBusy(state, holdOrOpt.salonId, holdOrOpt.chairId, holdOrOpt.date, holdOrOpt.start, holdOrOpt.end, ig);
  if (busy) return { ok: false, reason: `This chair was just ${busy}. Pick another time.` };
  const f = expertFree(state, holdOrOpt.expertId, holdOrOpt.salonId, holdOrOpt.date, holdOrOpt.start, holdOrOpt.end, ig);
  if (!f.ok) return { ok: false, reason: 'This expert is no longer free at that time. Pick another time or expert.' };
  if (holdOrOpt.expires && holdOrOpt.expires < Date.now()) return { ok: false, reason: 'Your 5-minute hold ran out. Choose the time again.' };
  const b = makeBooking(state, { ...holdOrOpt, travel: f.travel }, customer, channel);
  b.payment = payment;
  state.bookings.push(b);
  state.holds = state.holds.filter((h) => h.id !== holdOrOpt.id);
  save();
  return { ok: true, booking: b };
}

export function setStatus(state, id, status) {
  const b = state.bookings.find((x) => x.id === id); if (!b) return;
  b.status = status;
  if (status === 'completed' && b.payment === 'pending') b.payment = 'paid';
  if (status === 'cancelled' && b.payment === 'paid') b.payment = 'refunded';
  save();
}

export function recalc(state, b) {
  const s = svc(b.serviceId, state), sal = salon(b.salonId, state);
  const products = b.productsUsed.reduce((sum, p) => sum + (sal.rates[p.id] || 0) * p.qty, 0);
  b.split.products = products;
  b.split.arman = b.split.price - b.split.salonFee - products - b.split.expertPay - b.split.travel;
  return s;
}

// ---------- Finance roll-ups ----------
export function inRange(b, from, to) { return b.date >= from && b.date <= to; }
export function totals(list) {
  const t = { count: list.length, revenue: 0, salonFee: 0, products: 0, expertPay: 0, travel: 0, arman: 0, refunds: 0 };
  for (const b of list) {
    if (b.status === 'cancelled') { if (b.payment === 'refunded') t.refunds += b.split.price; continue; }
    t.revenue += b.split.price; t.salonFee += b.split.salonFee; t.products += b.split.products; t.expertPay += b.split.expertPay; t.travel += b.split.travel; t.arman += b.split.arman;
  }
  return t;
}
export function payable(state, kind, id) {
  const done = state.bookings.filter((b) => b.status === 'completed' && (kind === 'salon' ? b.salonId === id : b.expertId === id));
  const settled = new Set(state.settlements.filter((s) => s.kind === kind && s.partyId === id).flatMap((s) => s.bookingIds));
  const open = done.filter((b) => !settled.has(b.id));
  const amount = open.reduce((sum, b) => sum + (kind === 'salon' ? b.split.salonFee + b.split.products : b.split.expertPay + b.split.travel), 0);
  return { open, amount, history: state.settlements.filter((s) => s.kind === kind && s.partyId === id) };
}
export function settle(state, kind, id) {
  const p = payable(state, kind, id);
  if (!p.open.length) return;
  state.settlements.push({ id: 'ST-' + Date.now(), kind, partyId: id, amount: p.amount, bookingIds: p.open.map((b) => b.id), date: today() });
  save();
}

export const STATUS_LABEL = { confirmed: 'Confirmed', checkedin: 'Checked in', inservice: 'In service', completed: 'Completed', cancelled: 'Cancelled', noshow: 'No-show' };
