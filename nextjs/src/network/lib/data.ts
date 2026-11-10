// Arman Partner Network — data store, booking engine and finance rules.
// Phase 1 keeps everything in localStorage so a booking made in one portal shows in all others.
// Phase 2 swaps these functions for Supabase queries; the types below are the target schema.

export type Status = 'confirmed' | 'checkedin' | 'inservice' | 'completed' | 'cancelled' | 'noshow';
export type Payment = 'pending' | 'paid' | 'refunded';

export interface ProductUse { id: string; qty: number }
export interface Service { id: string; name: string; cat: string; duration: number; price: number; wash: boolean; skill: string; products: ProductUse[]; expertPay: number; desc: string }
export interface Expert { id: string; name: string; phone: string; skills: string[]; home: string; start: number; end: number; status: 'active' | 'leave'; rating: number }
export interface Chair { id: string; name: string; wash: boolean; active: boolean }
export interface Salon { id: string; name: string; area: string; address: string; owner: string; phone: string; status: 'approved' | 'pending' | 'suspended'; open: number; close: number; seatFee: number; chairs: Chair[]; facilities: string[]; rates: Record<string, number> }
export interface Split { price: number; salonFee: number; products: number; expertPay: number; travel: number; arman: number }
export interface Customer { name: string; phone: string }
export interface Booking { id: string; serviceId: string; salonId: string; chairId: string; expertId: string; date: string; start: number; end: number; customer: Customer; channel: string; status: Status; payment: Payment; productsUsed: ProductUse[]; split: Split; createdAt: number }
export interface Block { id: string; salonId: string; chairId: string; date: string; start: number; end: number; reason: string }
export interface Slot { serviceId: string; date: string; salonId: string; chairId: string; start: number; end: number; expertId: string; travel: boolean }
export interface Option extends Slot { alternatives: string[] }
export interface Hold extends Slot { id: string; expires: number }
export interface Settlement { id: string; kind: 'salon' | 'expert'; partyId: string; amount: number; bookingIds: string[]; date: string }
export interface State { services: Service[]; experts: Expert[]; salons: Salon[]; catalog: Record<string, { name: string; unit: string }>; bookings: Booking[]; blocks: Block[]; holds: Hold[]; settlements: Settlement[]; seq: number }

import { REMOTE, rest, rpc, currentProfile } from './supabase';

export { REMOTE };
const KEY = 'arman-network-v1';

export const pad = (n: number) => String(n).padStart(2, '0');
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => toISO(new Date());
export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return toISO(d); };
export const hm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const hm12 = (m: number) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}:${pad(mm)} ${h < 12 ? 'AM' : 'PM'}`; };
export const toMin = (v: string) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
export const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', opts);

export const TRAVEL_FEE = 150;   // paid to expert when they come from another salon
export const BUFFER = 15;        // cleanup minutes after every service
export const HOLD_MIN = 5;       // seat + expert hold while the customer confirms
export const SLOT = 15;          // grid step in minutes

export const STATUS_LABEL: Record<Status, string> = { confirmed: 'Confirmed', checkedin: 'Checked in', inservice: 'In service', completed: 'Completed', cancelled: 'Cancelled', noshow: 'No-show' };

const SERVICES: Service[] = [
  { id: 'cut', name: 'Hair Cut & Style', cat: 'Cut', duration: 60, price: 700, wash: true, skill: 'cut', products: [], expertPay: 300, desc: 'Consultation, wash, cut and styling' },
  { id: 'beard', name: 'Beard & Grooming', cat: 'Cut', duration: 30, price: 400, wash: false, skill: 'beard', products: [], expertPay: 180, desc: 'Beard shaping, trim and hot towel' },
  { id: 'colour', name: 'Hair Colour', cat: 'Colour', duration: 120, price: 2800, wash: true, skill: 'colour', products: [{ id: 'loreal', qty: 1 }], expertPay: 800, desc: 'Global or root touch-up colour' },
  { id: 'keratin', name: 'Keratin Treatment', cat: 'Treatment', duration: 150, price: 4500, wash: true, skill: 'keratin', products: [{ id: 'keratin-kit', qty: 1 }], expertPay: 1200, desc: 'Frizz control and smooth finish' },
  { id: 'spa', name: 'Hair Spa', cat: 'Treatment', duration: 60, price: 1200, wash: true, skill: 'spa', products: [{ id: 'spa-cream', qty: 1 }], expertPay: 400, desc: 'Nourishment and scalp care' },
  { id: 'rebond', name: 'Rebonding', cat: 'Treatment', duration: 180, price: 5500, wash: true, skill: 'rebond', products: [{ id: 'rebond-kit', qty: 1 }], expertPay: 1500, desc: 'Permanent straightening' },
  { id: 'bridal', name: 'Bridal Styling', cat: 'Styling', duration: 120, price: 6000, wash: false, skill: 'bridal', products: [{ id: 'styling', qty: 1 }], expertPay: 2000, desc: 'Bridal or occasion hair styling' },
  { id: 'olaplex', name: 'Olaplex Add-on', cat: 'Treatment', duration: 30, price: 900, wash: true, skill: 'colour', products: [{ id: 'olaplex', qty: 1 }], expertPay: 250, desc: 'Bond repair with any colour service' },
];

const EXPERTS: Expert[] = [
  { id: 'rohan', name: 'Rohan Verma', phone: '98260 11001', skills: ['cut', 'beard', 'spa'], home: 'MP Nagar', start: 600, end: 1260, status: 'active', rating: 4.8 },
  { id: 'asif', name: 'Asif Khan', phone: '98260 11002', skills: ['colour', 'rebond', 'keratin', 'cut'], home: 'Kolar Road', start: 600, end: 1260, status: 'active', rating: 4.9 },
  { id: 'neha', name: 'Neha Sharma', phone: '98260 11003', skills: ['keratin', 'spa', 'bridal', 'colour'], home: 'Arera Colony', start: 660, end: 1260, status: 'active', rating: 4.7 },
  { id: 'sameer', name: 'Sameer Ali', phone: '98260 11004', skills: ['cut', 'beard', 'rebond'], home: 'New Market', start: 600, end: 1200, status: 'active', rating: 4.6 },
  { id: 'pooja', name: 'Pooja Rathore', phone: '98260 11005', skills: ['bridal', 'colour', 'spa', 'keratin'], home: 'MP Nagar', start: 660, end: 1260, status: 'leave', rating: 4.8 },
];

const CATALOG: State['catalog'] = {
  loreal: { name: "L'Oréal colour tube", unit: '100 ml' },
  'keratin-kit': { name: 'Keratin kit', unit: 'per service' },
  'spa-cream': { name: 'Spa cream', unit: '50 g' },
  'rebond-kit': { name: 'Rebonding kit', unit: 'per service' },
  styling: { name: 'Styling kit', unit: 'per service' },
  olaplex: { name: 'Olaplex No.1', unit: '15 ml' },
};

const chair = (id: string, name: string, wash: boolean, active = true): Chair => ({ id, name, wash, active });
const SALONS: Salon[] = [
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

const FIRST = ['Vikram', 'Neha', 'Pooja', 'Aman', 'Riya', 'Kunal', 'Sana', 'Arjun', 'Meera', 'Imran', 'Tanya', 'Harsh', 'Ayesha', 'Rahul', 'Divya'];
const LAST = ['S.', 'P.', 'R.', 'K.', 'M.', 'J.', 'T.', 'B.'];

function seed(): State {
  let rng = 7;
  const rand = () => { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; };
  const state: State = { services: structuredClone(SERVICES), experts: structuredClone(EXPERTS), salons: structuredClone(SALONS), catalog: CATALOG, bookings: [], blocks: [], holds: [], settlements: [], seq: 1040 };
  const t = today();
  for (let d = -59; d <= 6; d++) {
    const date = addDays(t, d);
    const n = d < 0 ? 4 + Math.floor(rand() * 5) : d === 0 ? 7 : 2 + Math.floor(rand() * 4);
    for (let i = 0; i < n; i++) {
      const svc = SERVICES[Math.floor(rand() * 7)];
      const sal = SALONS[Math.floor(rand() * 3)];
      const start = sal.open + Math.floor(rand() * ((sal.close - sal.open - svc.duration) / 15)) * 15;
      const opt = findOptions(state, { serviceId: svc.id, date, salonId: sal.id, from: start, to: start, seeding: true })[0];
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

// ---------- Store ----------
// Demo mode (no Supabase env): seeded data in localStorage, so every portal shares it in this browser.
// Supabase mode: data loads from the database; every change goes through the API and reloads.
let cache: State | null = null;
let version = 0;
let loadState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
let loadError = '';
const loadedDays = new Set<string>();
const listeners = new Set<() => void>();
const notify = () => { version++; listeners.forEach((f) => f()); };
export const notifyAll = () => notify();
const emptyState = (): State => ({ services: [], experts: [], salons: [], catalog: {}, bookings: [], blocks: [], holds: [], settlements: [], seq: 0 });

export function db(): State {
  if (cache) return cache;
  if (REMOTE) { cache = emptyState(); return cache; }
  try { const raw = localStorage.getItem(KEY); if (raw) cache = JSON.parse(raw) as State; } catch { /* storage blocked */ }
  if (!cache) { cache = seed(); persist(); }
  loadState = 'ready';
  return cache;
}
function persist() { if (REMOTE) return; try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* ignore */ } }
/** Persist and re-render every subscribed screen. */
export function save() { persist(); notify(); }
export function subscribe(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; }
export const getVersion = () => version;
export const isReady = () => (REMOTE ? loadState === 'ready' : true);
export const getLoadError = () => loadError;
export function reload() { if (REMOTE) { void load(); return; } cache = null; db(); notify(); }
export function resetDemo() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } cache = null; db(); notify(); }
export const STORAGE_KEY = KEY;

// ---------- Supabase mapping ----------
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const mapService = (r: Row): Service => ({ id: r.id, name: r.name, cat: r.category, duration: r.duration_min, price: r.price, wash: r.needs_wash, skill: r.skill, expertPay: r.expert_payout, desc: r.description, products: (r.service_products || []).map((p: Row) => ({ id: p.product_id, qty: p.qty })) });
const mapSalon = (r: Row): Salon => ({ id: r.id, name: r.name, area: r.area, address: r.address, owner: r.owner_name ?? '', phone: r.phone ?? '', status: r.status, open: r.open_min, close: r.close_min, seatFee: r.seat_fee, facilities: r.facilities || [],
  chairs: (r.chairs || []).map((c: Row) => ({ id: c.id, name: c.name, wash: c.has_wash, active: c.active })).sort((a: Chair, b: Chair) => a.name.localeCompare(b.name)),
  rates: Object.fromEntries((r.salon_product_rates || []).map((p: Row) => [p.product_id, p.rate])) });
const mapExpert = (r: Row): Expert => ({ id: r.id, name: r.name, phone: r.phone ?? '', skills: r.skills || [], home: r.home_area, start: r.start_min, end: r.end_min, status: r.status, rating: Number(r.rating) });
export const mapBooking = (r: Row): Booking => ({ id: r.id, serviceId: r.service_id, salonId: r.salon_id, chairId: r.chair_id, expertId: r.expert_id, date: r.date, start: r.start_min, end: r.end_min,
  customer: r.booking_customers ? { name: r.booking_customers.name, phone: r.booking_customers.phone } : { name: 'Arman client', phone: '' },
  channel: r.channel, status: r.status, payment: r.payment, productsUsed: r.products_used || [],
  split: { price: r.price, salonFee: r.salon_fee, products: r.products_amt, expertPay: r.expert_pay, travel: r.travel, arman: r.arman }, createdAt: Date.parse(r.created_at) || 0 });

export async function reloadRemote() { await load(); }
async function load() {
  if (!REMOTE) return;
  loadState = cache && loadState === 'ready' ? 'ready' : 'loading';
  const prof = currentProfile();
  const authed = !!prof;
  const salonCols = authed ? '*' : 'id,name,area,address,status,open_min,close_min,seat_fee,facilities';
  const expertCols = authed ? '*' : 'id,name,skills,home_area,start_min,end_min,status,rating';
  const from = addDays(today(), -120), to = addDays(today(), 60);
  try {
    const [services, catalog, salons, experts, bookings, blocks, settlements] = await Promise.all([
      rest<Row[]>('services?select=*,service_products(product_id,qty)&active=eq.true&order=sort'),
      rest<Row[]>('catalog_products?select=*'),
      rest<Row[]>(`salons?select=${salonCols},chairs(id,name,has_wash,active),salon_product_rates(product_id,rate)&order=name`),
      rest<Row[]>(`experts?select=${expertCols}&order=name`),
      authed ? rest<Row[]>(`bookings?select=*,booking_customers(name,phone)&date=gte.${from}&date=lte.${to}&order=date,start_min`) : Promise.resolve([]),
      authed ? rest<Row[]>(`chair_blocks?select=*&date=gte.${addDays(today(), -7)}`) : Promise.resolve([]),
      authed ? rest<Row[]>('settlements?select=*&order=created_at') : Promise.resolve([]),
    ]);
    const s = cache || emptyState();
    s.services = services.map(mapService);
    s.catalog = Object.fromEntries(catalog.map((c) => [c.id, { name: c.name, unit: c.unit }]));
    s.salons = salons.map(mapSalon);
    s.experts = experts.map(mapExpert);
    s.bookings = bookings.map(mapBooking);
    s.blocks = blocks.map((k) => ({ id: k.id, salonId: k.salon_id, chairId: k.chair_id, date: k.date, start: k.start_min, end: k.end_min, reason: k.reason }));
    s.settlements = settlements.map((x) => ({ id: x.id, kind: x.kind, partyId: x.party_id, amount: x.amount, bookingIds: x.booking_ids, date: x.date }));
    s.holds = [];
    cache = s; loadState = 'ready'; loadError = '';
    const days = [...loadedDays]; loadedDays.clear();
    await Promise.all(days.map((d) => ensureDay(d)));
  } catch (e) {
    loadState = 'error'; loadError = (e as Error).message;
  }
  notify();
}

export function ensureLoaded() { if (REMOTE && loadState === 'idle') void load(); }

/** Live holds (and, for the public booking page, anonymised busy slots) for one day. */
export async function ensureDay(date: string) {
  if (!REMOTE) return;
  loadedDays.add(date);
  try {
    const rows = await rpc<Row[]>('availability', { p_date: date });
    const s = db();
    s.holds = s.holds.filter((h) => h.date !== date).concat(rows.filter((r) => r.kind === 'hold').map((r) => ({
      id: r.ref, serviceId: r.service_id, salonId: r.salon_id, chairId: r.chair_id, expertId: r.expert_id, date, start: r.start_min, end: r.end_min, travel: false, expires: Date.parse(r.expires_at) })));
    if (!currentProfile()) {
      s.bookings = s.bookings.filter((b) => b.date !== date).concat(rows.filter((r) => r.kind === 'booking').map((r) => ({
        id: r.ref, serviceId: r.service_id, salonId: r.salon_id, chairId: r.chair_id, expertId: r.expert_id, date, start: r.start_min, end: r.end_min,
        customer: { name: '', phone: '' }, channel: 'online', status: r.status, payment: 'pending', productsUsed: [],
        split: { price: 0, salonFee: 0, products: 0, expertPay: 0, travel: 0, arman: 0 }, createdAt: 0 })));
      s.blocks = s.blocks.filter((k) => k.date !== date).concat(rows.filter((r) => r.kind === 'block').map((r) => ({ id: r.ref, salonId: r.salon_id, chairId: r.chair_id, date, start: r.start_min, end: r.end_min, reason: r.status || 'Blocked' })));
    }
    notify();
  } catch { /* keep what we have */ }
}

export const svc = (id: string, s = db()) => s.services.find((x) => x.id === id)!;
export const salon = (id: string, s = db()) => s.salons.find((x) => x.id === id)!;
export const expert = (id: string, s = db()) => s.experts.find((x) => x.id === id)!;
export const chairOf = (b: Booking, s = db()) => salon(b.salonId, s)?.chairs.find((c) => c.id === b.chairId);

// ---------- Revenue split: customer price → salon, products, expert, travel, Arman ----------
export function split(service: Service, sal: Salon, travel: boolean): Split {
  const products = service.products.reduce((sum, p) => sum + (sal.rates[p.id] || 0) * p.qty, 0);
  const travelFee = travel ? TRAVEL_FEE : 0;
  return { price: service.price, salonFee: sal.seatFee, products, expertPay: service.expertPay, travel: travelFee, arman: service.price - sal.seatFee - products - service.expertPay - travelFee };
}

// ---------- Booking engine ----------
const live = (b: Booking) => b.status !== 'cancelled' && b.status !== 'noshow';
const overlap = (a1: number, a2: number, b1: number, b2: number) => a1 < b2 && b1 < a2;
function activeHolds(state: State) { const now = Date.now(); state.holds = state.holds.filter((h) => h.expires > now); return state.holds; }

interface Ignore { bookingId?: string; holdId?: string; skipHolds?: boolean }

export function chairBusy(state: State, salonId: string, chairId: string, date: string, start: number, end: number, ig: Ignore = {}): 'booked' | 'blocked' | 'held' | null {
  const e = end + BUFFER;
  if (state.bookings.some((b) => live(b) && b.id !== ig.bookingId && b.salonId === salonId && b.chairId === chairId && b.date === date && overlap(start, e, b.start, b.end + BUFFER))) return 'booked';
  if (state.blocks.some((k) => k.salonId === salonId && k.chairId === chairId && k.date === date && overlap(start, e, k.start, k.end))) return 'blocked';
  if (!ig.skipHolds && activeHolds(state).some((h) => h.id !== ig.holdId && h.salonId === salonId && h.chairId === chairId && h.date === date && overlap(start, e, h.start, h.end + BUFFER))) return 'held';
  return null;
}

/** Expert must be inside working hours and free, with travel time if their previous/next job is at another salon. */
export function expertFree(state: State, expertId: string, salonId: string, date: string, start: number, end: number, ig: Ignore = {}): { ok: boolean; travel: boolean } {
  const x = expert(expertId, state);
  if (!x || x.status !== 'active' || start < x.start || end > x.end) return { ok: false, travel: false };
  const jobs: { salonId: string; start: number; end: number }[] = [
    ...state.bookings.filter((b) => live(b) && b.id !== ig.bookingId && b.expertId === expertId && b.date === date),
    ...(ig.skipHolds ? [] : activeHolds(state).filter((h) => h.id !== ig.holdId && h.expertId === expertId && h.date === date)),
  ];
  for (const j of jobs) {
    const gap = j.salonId === salonId ? BUFFER : 30 + BUFFER;
    if (overlap(start - gap, end + gap, j.start, j.end)) return { ok: false, travel: false };
  }
  const prev = jobs.filter((j) => j.end <= start).sort((a, b) => b.end - a.end)[0];
  const travel = prev ? prev.salonId !== salonId : x.home !== salon(salonId, state).area;
  return { ok: true, travel };
}

/** Every (salon, chair, expert, start) that fits the service's facility needs, salon hours, chair and expert availability. */
export function findOptions(state: State, q: { serviceId: string; date: string; salonId?: string; expertId?: string; from?: number; to?: number; seeding?: boolean }): Option[] {
  const s = svc(q.serviceId, state);
  if (!s) return [];
  const out: Option[] = [];
  const ig: Ignore = { skipHolds: !!q.seeding };
  const salons = state.salons.filter((x) => x.status === 'approved' && (!q.salonId || x.id === q.salonId));
  const experts = state.experts.filter((x) => x.status === 'active' && x.skills.includes(s.skill) && (!q.expertId || x.id === q.expertId));
  const minStart = q.date === today() && !q.seeding ? Math.ceil((nowMin() + 30) / SLOT) * SLOT : 0;
  for (const sal of salons) {
    for (let t = Math.max(sal.open, q.from ?? 0, minStart); t + s.duration <= sal.close && t <= (q.to ?? 1440); t += SLOT) {
      const end = t + s.duration;
      const ch = sal.chairs.find((c) => c.active && (!s.wash || c.wash) && !chairBusy(state, sal.id, c.id, q.date, t, end, ig));
      if (!ch) continue;
      const ranked = experts.map((x) => ({ x, f: expertFree(state, x.id, sal.id, q.date, t, end, ig) })).filter((r) => r.f.ok)
        .sort((a, b) => Number(a.f.travel) - Number(b.f.travel) || b.x.rating - a.x.rating);
      if (!ranked.length) continue;
      out.push({ serviceId: q.serviceId, date: q.date, salonId: sal.id, chairId: ch.id, start: t, end, expertId: ranked[0].x.id, travel: ranked[0].f.travel, alternatives: ranked.map((r) => r.x.id) });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

export function hold(state: State, opt: Slot): Hold {
  const { serviceId, date, salonId, chairId, start, end, expertId, travel } = opt;
  const h: Hold = { serviceId, date, salonId, chairId, start, end, expertId, travel, id: 'H' + Date.now(), expires: Date.now() + HOLD_MIN * 60000 };
  state.holds.push(h); save();
  return h;
}
export function releaseHold(state: State, id: string) { state.holds = state.holds.filter((h) => h.id !== id); save(); }

export function makeBooking(state: State, opt: Slot, customer: Customer, channel: string): Booking {
  const s = svc(opt.serviceId, state), sal = salon(opt.salonId, state);
  return {
    id: 'AHS-' + (state.seq++), serviceId: opt.serviceId, salonId: opt.salonId, chairId: opt.chairId, expertId: opt.expertId,
    date: opt.date, start: opt.start, end: opt.end, customer, channel, status: 'confirmed', payment: 'pending',
    productsUsed: s.products.map((p) => ({ ...p })), split: split(s, sal, opt.travel), createdAt: Date.now(),
  };
}

/** Atomic confirm: re-check chair and expert against everything except our own hold, then write. */
export function confirm(state: State, slot: Slot & { id?: string; expires?: number }, customer: Customer, channel = 'online', payment: Payment = 'pending'): { ok: true; booking: Booking } | { ok: false; reason: string } {
  const ig: Ignore = { holdId: slot.id };
  if (slot.expires && slot.expires < Date.now()) return { ok: false, reason: 'Your 5-minute hold ran out. Choose the time again.' };
  const busy = chairBusy(state, slot.salonId, slot.chairId, slot.date, slot.start, slot.end, ig);
  if (busy) return { ok: false, reason: `This chair was just ${busy}. Pick another time.` };
  const f = expertFree(state, slot.expertId, slot.salonId, slot.date, slot.start, slot.end, ig);
  if (!f.ok) return { ok: false, reason: 'This expert is no longer free at that time. Pick another time or expert.' };
  const b = makeBooking(state, { ...slot, travel: f.travel }, customer, channel);
  b.payment = payment;
  state.bookings.push(b);
  state.holds = state.holds.filter((h) => h.id !== slot.id);
  save();
  return { ok: true, booking: b };
}

export function setStatus(state: State, id: string, status: Status) {
  const b = state.bookings.find((x) => x.id === id); if (!b) return;
  b.status = status;
  if (status === 'completed' && b.payment === 'pending') b.payment = 'paid';
  if (status === 'cancelled' && b.payment === 'paid') b.payment = 'refunded';
  save();
}

export function recalc(state: State, b: Booking) {
  const sal = salon(b.salonId, state);
  b.split.products = b.productsUsed.reduce((sum, p) => sum + (sal.rates[p.id] || 0) * p.qty, 0);
  b.split.arman = b.split.price - b.split.salonFee - b.split.products - b.split.expertPay - b.split.travel;
}

// ---------- Finance roll-ups ----------
export const inRange = (b: Booking, from: string, to: string) => b.date >= from && b.date <= to;
export type Totals = Omit<Split, 'price'> & { count: number; revenue: number; refunds: number };
export function totals(list: Booking[]): Totals {
  const t: Totals = { count: 0, revenue: 0, salonFee: 0, products: 0, expertPay: 0, travel: 0, arman: 0, refunds: 0 };
  for (const b of list) {
    if (!live(b)) { if (b.payment === 'refunded') t.refunds += b.split.price; continue; }
    t.count++; t.revenue += b.split.price; t.salonFee += b.split.salonFee; t.products += b.split.products; t.expertPay += b.split.expertPay; t.travel += b.split.travel; t.arman += b.split.arman;
  }
  return t;
}
export function payable(state: State, kind: 'salon' | 'expert', id: string) {
  const done = state.bookings.filter((b) => b.status === 'completed' && (kind === 'salon' ? b.salonId === id : b.expertId === id));
  const settled = new Set(state.settlements.filter((s) => s.kind === kind && s.partyId === id).flatMap((s) => s.bookingIds));
  const open = done.filter((b) => !settled.has(b.id));
  const amount = open.reduce((sum, b) => sum + (kind === 'salon' ? b.split.salonFee + b.split.products : b.split.expertPay + b.split.travel), 0);
  return { open, amount, history: state.settlements.filter((s) => s.kind === kind && s.partyId === id) };
}
export function settle(state: State, kind: 'salon' | 'expert', id: string) {
  const p = payable(state, kind, id);
  if (!p.open.length) return;
  state.settlements.push({ id: 'ST-' + Date.now(), kind, partyId: id, amount: p.amount, bookingIds: p.open.map((b) => b.id), date: today() });
  save();
}
