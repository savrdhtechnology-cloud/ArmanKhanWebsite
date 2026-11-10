// Actions used by every screen. Same call in demo mode and Supabase mode.
// Each resolves to an error message, or null on success.
import {
  Block, Booking, Chair, Customer, Expert, Hold, Payment, ProductUse, Salon, Service, Slot, State, Status,
  REMOTE, confirm, db, expert, expertFree, hold, notifyAll, pad, recalc, releaseHold, reloadRemote, ensureDay,
  mapBooking, salon, save, setStatus, settle, svc,
} from './data';
import { rest, rpc } from './supabase';

type Result = Promise<string | null>;
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function run(local: (s: State) => void, remote: () => Promise<unknown>): Result {
  if (!REMOTE) { local(db()); save(); return null; }
  try { await remote(); await reloadRemote(); return null; } catch (e) { return (e as Error).message; }
}
const q = (v: string) => encodeURIComponent(v);
const findB = (s: State, id: string) => s.bookings.find((b) => b.id === id)!;

function salonRow(p: Partial<Salon>): Row {
  const r: Row = {};
  if (p.status !== undefined) r.status = p.status;
  if (p.seatFee !== undefined) r.seat_fee = p.seatFee;
  if (p.open !== undefined) r.open_min = p.open;
  if (p.close !== undefined) r.close_min = p.close;
  if (p.facilities !== undefined) r.facilities = p.facilities;
  if (p.name !== undefined) r.name = p.name;
  if (p.area !== undefined) r.area = p.area;
  if (p.address !== undefined) r.address = p.address;
  if (p.owner !== undefined) r.owner_name = p.owner;
  if (p.phone !== undefined) r.phone = p.phone;
  return r;
}

export const act = {
  setStatus: (id: string, status: Status) => run((s) => setStatus(s, id, status), () => rest(`bookings?id=eq.${q(id)}`, { method: 'PATCH', body: { status } })),
  markPaid: (id: string) => run((s) => { findB(s, id).payment = 'paid'; }, () => rest(`bookings?id=eq.${q(id)}`, { method: 'PATCH', body: { payment: 'paid' } })),
  reassign: (id: string, expertId: string) => run((s) => { findB(s, id).expertId = expertId; }, () => rpc('reassign_expert', { p_booking: id, p_expert: expertId })),
  setProducts: (id: string, productsUsed: ProductUse[]) => run(
    (s) => { const b = findB(s, id); b.productsUsed = productsUsed; recalc(s, b); },
    () => rest(`bookings?id=eq.${q(id)}`, { method: 'PATCH', body: { products_used: productsUsed } })),

  updateSalon: (id: string, patch: Partial<Salon>) => run((s) => { Object.assign(salon(id, s), patch); }, () => rest(`salons?id=eq.${q(id)}`, { method: 'PATCH', body: salonRow(patch) })),
  addSalon: (x: Omit<Salon, 'id' | 'rates'>) => run(
    (s) => { s.salons.push({ ...x, id: 's' + Date.now(), rates: { ...(s.salons[0]?.rates || {}) } }); },
    async () => {
      const [row] = await rest<Row[]>('salons', { method: 'POST', body: salonRow(x), prefer: 'return=representation' });
      await rest('chairs', { method: 'POST', body: x.chairs.map((c) => ({ salon_id: row.id, id: c.id, name: c.name, has_wash: c.wash, active: c.active })) });
      const base = db().salons[0]?.rates || {};
      const rates = Object.entries(base).map(([product_id, rate]) => ({ salon_id: row.id, product_id, rate }));
      if (rates.length) await rest('salon_product_rates', { method: 'POST', body: rates });
    }),
  updateChair: (salonId: string, chairId: string, patch: Partial<Chair>) => run(
    (s) => { Object.assign(salon(salonId, s).chairs.find((c) => c.id === chairId)!, patch); },
    () => rest(`chairs?salon_id=eq.${q(salonId)}&id=eq.${q(chairId)}`, { method: 'PATCH', body: {
      ...(patch.wash !== undefined && { has_wash: patch.wash }), ...(patch.active !== undefined && { active: patch.active }), ...(patch.name !== undefined && { name: patch.name }) } })),
  addChair: (salonId: string) => {
    const n = salon(salonId).chairs.length + 1;
    const c: Chair = { id: `c${n}-${Date.now().toString(36)}`, name: `Chair ${pad(n)}`, wash: false, active: true };
    return run((s) => { salon(salonId, s).chairs.push(c); }, () => rest('chairs', { method: 'POST', body: { salon_id: salonId, id: c.id, name: c.name, has_wash: false, active: true } }));
  },
  setRate: (salonId: string, productId: string, rate: number) => run((s) => { salon(salonId, s).rates[productId] = rate; },
    () => rest('salon_product_rates', { method: 'POST', body: { salon_id: salonId, product_id: productId, rate }, prefer: 'resolution=merge-duplicates' })),

  updateService: (id: string, patch: Partial<Pick<Service, 'price' | 'expertPay'>>) => run((s) => { Object.assign(svc(id, s), patch); },
    () => rest(`services?id=eq.${q(id)}`, { method: 'PATCH', body: { ...(patch.price !== undefined && { price: patch.price }), ...(patch.expertPay !== undefined && { expert_payout: patch.expertPay }) } })),
  updateExpert: (id: string, patch: Partial<Expert>) => run((s) => { Object.assign(expert(id, s), patch); },
    () => rest(`experts?id=eq.${q(id)}`, { method: 'PATCH', body: {
      ...(patch.status !== undefined && { status: patch.status }), ...(patch.skills !== undefined && { skills: patch.skills }),
      ...(patch.start !== undefined && { start_min: patch.start }), ...(patch.end !== undefined && { end_min: patch.end }),
      ...(patch.phone !== undefined && { phone: patch.phone }), ...(patch.home !== undefined && { home_area: patch.home }) } })),
  addExpert: (x: Omit<Expert, 'id' | 'rating'>) => run((s) => { s.experts.push({ ...x, id: 'x' + Date.now(), rating: 5 }); },
    () => rest('experts', { method: 'POST', body: { name: x.name, phone: x.phone, skills: x.skills, home_area: x.home, start_min: x.start, end_min: x.end, status: x.status } })),

  addBlock: (k: Omit<Block, 'id'>) => run((s) => { s.blocks.push({ ...k, id: 'blk' + Date.now() }); },
    () => rest('chair_blocks', { method: 'POST', body: { salon_id: k.salonId, chair_id: k.chairId, date: k.date, start_min: k.start, end_min: k.end, reason: k.reason } })),
  removeBlock: (id: string) => run((s) => { s.blocks = s.blocks.filter((x) => x.id !== id); }, () => rest(`chair_blocks?id=eq.${q(id)}`, { method: 'DELETE' })),

  settle: (kind: 'salon' | 'expert', id: string) => run((s) => settle(s, kind, id), () => rpc('settle_party', { p_kind: kind, p_party: id })),

  /** Hold chair + expert for 5 minutes while the customer finishes. */
  async hold(opt: Slot): Promise<{ hold: Hold } | { error: string }> {
    if (!REMOTE) return { hold: hold(db(), opt) };
    try {
      const r = await rpc<{ id: string; expires: number; travel: boolean; end_min: number }>('hold_slot', {
        p_service: opt.serviceId, p_salon: opt.salonId, p_chair: opt.chairId, p_expert: opt.expertId, p_date: opt.date, p_start: opt.start });
      const h: Hold = { ...opt, id: r.id, expires: r.expires, travel: r.travel, end: r.end_min };
      db().holds.push(h); notifyAll();
      return { hold: h };
    } catch (e) { void ensureDay(opt.date); return { error: (e as Error).message }; }
  },
  async changeHoldExpert(h: Hold, expertId: string): Result {
    if (!REMOTE) {
      const f = expertFree(db(), expertId, h.salonId, h.date, h.start, h.end, { holdId: h.id });
      if (!f.ok) return 'That expert was just booked. Choose another.';
      h.expertId = expertId; h.travel = f.travel; save(); return null;
    }
    try {
      const r = await rpc<{ travel: boolean }>('change_hold_expert', { p_hold: h.id, p_expert: expertId });
      h.expertId = expertId; h.travel = r.travel; notifyAll(); return null;
    } catch (e) { return (e as Error).message; }
  },
  async releaseHold(id: string) {
    if (!REMOTE) { releaseHold(db(), id); return; }
    db().holds = db().holds.filter((h) => h.id !== id); notifyAll();
    try { await rpc('release_hold', { p_hold: id }); } catch { /* it expires on its own */ }
  },
  /** Customer confirms a held slot. */
  async confirmHold(h: Hold, customer: Customer, payment: Payment): Promise<{ ok: true; booking: Booking } | { ok: false; reason: string }> {
    if (!REMOTE) return confirm(db(), h, customer, 'online', payment);
    try {
      const r = await rpc<Row>('confirm_booking', { p_hold: h.id, p_name: customer.name, p_phone: customer.phone });
      const b = mapBooking({ ...r, booking_customers: customer });
      const s = db(); s.holds = s.holds.filter((x) => x.id !== h.id); s.bookings.push(b); notifyAll();
      return { ok: true, booking: b };
    } catch (e) { return { ok: false, reason: (e as Error).message }; }
  },
  /** Admin walk-in / phone booking. */
  async adminBook(slot: Slot, customer: Customer, payment: Payment): Promise<{ ok: true; booking: Booking } | { ok: false; reason: string }> {
    if (!REMOTE) return confirm(db(), slot, customer, 'admin', payment);
    try {
      const r = await rpc<Row>('admin_create_booking', {
        p_service: slot.serviceId, p_salon: slot.salonId, p_chair: slot.chairId, p_expert: slot.expertId, p_date: slot.date, p_start: slot.start,
        p_name: customer.name, p_phone: customer.phone, p_payment: payment });
      await reloadRemote();
      return { ok: true, booking: mapBooking({ ...r, booking_customers: customer }) };
    } catch (e) { return { ok: false, reason: (e as Error).message }; }
  },
  /** Customer self-service lookup by booking ID + mobile number. */
  async findBooking(id: string, phone: string): Promise<Booking | null> {
    if (!REMOTE) return db().bookings.find((b) => b.id.toUpperCase() === id.trim().toUpperCase() && b.customer.phone === phone) ?? null;
    const r = await rpc<Row | null>('find_booking', { p_id: id, p_phone: phone });
    return r ? mapBooking({ ...r, salon_fee: 0, products_amt: 0, expert_pay: 0, travel: 0, arman: 0, booking_customers: { name: r.name, phone } }) : null;
  },
  async cancelMine(id: string, phone: string): Result {
    if (!REMOTE) { setStatus(db(), id, 'cancelled'); return null; }
    try { await rpc('cancel_my_booking', { p_id: id, p_phone: phone }); return null; } catch (e) { return (e as Error).message; }
  },
};
