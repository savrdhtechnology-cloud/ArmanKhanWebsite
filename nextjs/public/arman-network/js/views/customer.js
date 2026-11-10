import * as D from '../data.js';
import { esc, badge, toast, fmtDate, empty, icon } from '../ui.js';

const st = { step: 1, serviceId: null, salonId: 'any', date: null, start: null, optKey: null, expertId: 'auto', hold: null, name: '', phone: '', pay: 'salon', done: null, cat: 'All' };
const hist = { phone: '' };
const STEPS = ['Service', 'Salon', 'Date & time', 'Expert', 'Confirm'];

function reset() { Object.assign(st, { step: 1, serviceId: null, salonId: 'any', date: null, start: null, optKey: null, expertId: 'auto', hold: null, done: null }); }
function dropHold(s) { if (st.hold) { D.releaseHold(s, st.hold.id); st.hold = null; } }

function topNav(active) {
  return `<header class="cust-top no-print"><div class="in">
    <a class="brand" href="#/"><img src="/arman-network/assets/arman-logo.png" alt="Arman Hair Studio" style="height:32px" onerror="this.nextElementSibling.hidden=false;this.remove()"><span class="brand-text" style="font-size:17px" hidden>ARMAN<small>HAIR STUDIO</small></span></a>
    <nav aria-label="Customer"><a href="#/book" ${active === 'book' ? 'aria-current="page"' : ''}>Book</a><a href="#/book/history" ${active === 'history' ? 'aria-current="page"' : ''}>My bookings</a><a href="/armanhairstudios" class="hide-sm">Website</a></nav>
  </div></header>`;
}

function summary(s) {
  const v = st.serviceId && D.svc(st.serviceId, s);
  const sal = st.hold ? D.salon(st.hold.salonId, s) : st.salonId !== 'any' ? D.salon(st.salonId, s) : null;
  const ex = st.hold ? D.expert(st.hold.expertId, s) : null;
  const li = (k, v2) => `<div class="li"><span class="muted">${k}</span><b style="text-align:right">${v2}</b></div>`;
  return `<aside class="summary panel"><h2 class="h2" style="margin-bottom:8px">Your booking</h2>
    ${li('Service', v ? esc(v.name) : '—')}${li('Duration', v ? v.duration + ' min' : '—')}
    ${li('Salon', sal ? esc(sal.name) + `<div class="cell-sub">${esc(sal.area)}</div>` : st.salonId === 'any' && st.step > 2 ? 'Any nearby' : '—')}
    ${li('When', st.start != null && st.date ? `${fmtDate(st.date)}, ${D.hm12(st.start)}` : '—')}
    ${li('Expert', ex ? esc(ex.name) : st.step > 3 ? 'Auto' : '—')}
    <div class="li" style="font-size:16px"><span>Total</span><b class="num">${v ? D.inr(v.price) : '—'}</b></div>
    ${st.hold ? `<div class="holdbar" style="margin-top:10px">${icon('lock').replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px;margin-right:6px"')}Chair and expert held until ${new Date(st.hold.expires).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</div>` : ''}
  </aside>`;
}

function stepService(s) {
  const cats = ['All', ...new Set(s.services.map((v) => v.cat))];
  const list = s.services.filter((v) => st.cat === 'All' || v.cat === st.cat);
  return `<div class="panel-head"><h2 class="h2">Choose a service</h2><div class="seg" role="group" aria-label="Category">${cats.map((c) => `<button data-act="cat" data-v="${c}" aria-pressed="${st.cat === c}">${c}</button>`).join('')}</div></div>
    <div class="pick">${list.map((v) => `<button class="opt" data-act="svc" data-id="${v.id}" aria-pressed="${st.serviceId === v.id}"><span class="top"><span>${esc(v.name)}</span><span class="num">${D.inr(v.price)}</span></span><small>${esc(v.desc)}</small><small>${v.duration} min${v.wash ? ' · needs wash station' : ''}</small></button>`).join('')}</div>`;
}

function stepSalon(s) {
  const v = D.svc(st.serviceId, s);
  const list = s.salons.filter((x) => x.status === 'approved');
  return `<h2 class="h2" style="margin-bottom:14px">Where would you like it?</h2>
    <div class="pick">
      <button class="opt" data-act="salon" data-id="any" aria-pressed="${st.salonId === 'any'}"><span class="top"><span>Any partner salon</span>${icon('pin').replace('<svg', '<svg style="width:18px;height:18px;color:var(--gold-ink)"')}</span><small>We pick the salon with the earliest free chair and expert. Best for getting a slot fast.</small></button>
      ${list.map((x) => { const fits = x.chairs.some((c) => c.active && (!v.wash || c.wash)); return `<button class="opt" data-act="salon" data-id="${x.id}" aria-pressed="${st.salonId === x.id}" ${fits ? '' : 'disabled'}><span class="top"><span>${esc(x.name)}</span></span><small>${esc(x.address)}</small><small>${fits ? x.facilities.map(esc).join(', ') : 'No wash station free for this service'}</small></button>`; }).join('')}
    </div>
    <div class="row" style="margin-top:18px"><button class="btn" data-act="back">Back</button></div>`;
}

function stepTime(s) {
  st.date = st.date || D.today();
  const days = Array.from({ length: 10 }, (_, i) => D.addDays(D.today(), i));
  const opts = D.findOptions(s, { serviceId: st.serviceId, date: st.date, salonId: st.salonId === 'any' ? undefined : st.salonId });
  const byStart = new Map(); opts.forEach((o) => { if (!byStart.has(o.start)) byStart.set(o.start, o); });
  const groups = [['Morning', 0, 720], ['Afternoon', 720, 1020], ['Evening', 1020, 1440]];
  const times = groups.map(([g, a, b]) => {
    const list = [...byStart.values()].filter((o) => o.start >= a && o.start < b);
    if (!list.length) return '';
    return `<h3 class="muted" style="font-size:13px;margin:16px 0 8px">${g}</h3><div class="times">${list.map((o) => `<button class="time" data-act="time" data-start="${o.start}" aria-pressed="${st.start === o.start}">${D.hm12(o.start)}${st.salonId === 'any' ? `<small>${esc(D.salon(o.salonId, s).area)}</small>` : ''}</button>`).join('')}</div>`;
  }).join('');
  return `<h2 class="h2" style="margin-bottom:12px">Pick a date and time</h2>
    <div class="days" role="group" aria-label="Date">${days.map((d) => `<button class="day" data-act="day" data-d="${d}" aria-pressed="${st.date === d}"><small>${d === D.today() ? 'Today' : fmtDate(d, { weekday: 'short' })}</small><b>${fmtDate(d, { day: 'numeric' })}</b><small>${fmtDate(d, { month: 'short' })}</small></button>`).join('')}</div>
    ${times || empty('No free slots on this day', st.salonId === 'any' ? 'Every qualified expert or suitable chair is taken. Try another date.' : 'Try another date, or choose “Any partner salon”.')}
    <p class="muted" style="font-size:12.5px;margin-top:14px">Only times where a suitable chair and a qualified Arman expert are both free are shown.</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="back">Back</button></div>`;
}

function stepExpert(s) {
  const h = st.hold; const sal = D.salon(h.salonId, s); const v = D.svc(st.serviceId, s);
  const cands = s.experts.filter((x) => x.status === 'active' && x.skills.includes(v.skill) && D.expertFree(s, x.id, h.salonId, h.date, h.start, h.end, { holdId: h.id }).ok);
  return `<h2 class="h2" style="margin-bottom:4px">Choose your expert</h2><p class="muted" style="margin:0 0 14px">${esc(sal.name)}, ${esc(sal.area)} · ${fmtDate(h.date)} at ${D.hm12(h.start)}</p>
    <div class="pick">
      <button class="opt" data-act="ex" data-id="auto" aria-pressed="${st.expertId === 'auto'}"><span class="top"><span>Best available</span><span class="badge gold">Recommended</span></span><small>We assign the highest-rated expert who is already nearby.</small></button>
      ${cands.map((x) => `<button class="opt" data-act="ex" data-id="${x.id}" aria-pressed="${st.expertId === x.id}"><span class="top"><span>${esc(x.name)}</span><span class="num">★ ${x.rating}</span></span><small>${x.skills.map((k) => s.services.find((v2) => v2.skill === k)?.cat || k).filter((c, i, a) => a.indexOf(c) === i).join(', ')} specialist</small></button>`).join('')}
    </div>
    <div class="row" style="margin-top:18px"><button class="btn" data-act="back">Back</button><button class="btn primary" data-act="next">Continue</button></div>`;
}

function stepConfirm(s) {
  return `<h2 class="h2" style="margin-bottom:14px">Your details</h2>
    <div class="grid g2">
      <label class="field"><span>Full name</span><input class="input" id="c-name" data-input="name" value="${esc(st.name)}" autocomplete="name"></label>
      <label class="field"><span>Mobile number</span><input class="input" id="c-phone" data-input="phone" value="${esc(st.phone)}" inputmode="tel" autocomplete="tel" placeholder="10-digit mobile"></label>
    </div>
    <fieldset style="border:0;padding:0;margin:18px 0 0"><legend class="h2" style="margin-bottom:10px">Payment</legend>
      <div class="pick">
        <button class="opt" data-act="pay" data-v="salon" aria-pressed="${st.pay === 'salon'}"><span class="top">Pay after service</span><small>Pay Arman by UPI or card at the salon. Invoice is sent by SMS.</small></button>
        <button class="opt" data-act="pay" data-v="online" aria-pressed="${st.pay === 'online'}"><span class="top">Pay online now</span><small>UPI, card or netbanking. Phase 2 connects the payment gateway; here it is recorded as paid.</small></button>
      </div></fieldset>
    <p class="muted" style="font-size:12.5px;margin:14px 0 0">Free cancellation up to 2 hours before your appointment.</p>
    <div class="row" style="margin-top:18px"><button class="btn" data-act="back">Back</button><button class="btn gold lg" data-act="confirm">Confirm booking</button></div>`;
}

function success(s) {
  const b = s.bookings.find((x) => x.id === st.done); if (!b) { reset(); return ''; }
  const v = D.svc(b.serviceId, s), sal = D.salon(b.salonId, s), ex = D.expert(b.expertId, s);
  return `<div class="ticket"><div class="tk-head"><div style="color:var(--gold);font-weight:600">Booking confirmed</div><h1 class="title" style="margin-top:6px">${esc(v.name)}</h1><div style="color:#b4ad9d;margin-top:4px">${fmtDate(b.date, { weekday: 'long', day: 'numeric', month: 'long' })} at ${D.hm12(b.start)}</div></div>
    <div class="tk-body"><dl class="kv"><dt>Booking ID</dt><dd>${b.id}</dd><dt>Name</dt><dd>${esc(b.customer.name)}</dd><dt>Salon</dt><dd>${esc(sal.name)}<div class="cell-sub">${esc(sal.address)}</div></dd><dt>Expert</dt><dd>${esc(ex.name)}</dd><dt>Duration</dt><dd>${v.duration} min</dd><dt>Amount</dt><dd>${D.inr(b.split.price)} ${badge(b.payment, b.payment === 'paid' ? 'Paid' : 'Pay after service')}</dd></dl>
    <p class="muted" style="font-size:13px">Please reach 10 minutes early and show this booking ID at the salon counter.</p>
    <div class="row wrap no-print"><button class="btn" data-act="print">${icon('printer')}Print invoice</button><a class="btn" href="#/book/history">My bookings</a><button class="btn primary" data-act="again">Book another</button></div></div></div>`;
}

function bookView() {
  const s = D.db();
  if (st.hold && st.hold.expires < Date.now()) { st.hold = null; if (st.step > 3) { st.step = 3; st.start = null; toast('Your 5-minute hold ran out. Choose a time again.', 'bad'); } }
  if (st.done) return { title: 'Booking confirmed', role: 'customer', html: topNav('book') + `<div class="cust-in">${success(s)}</div>`, actions: acts };
  const body = [null, stepService, stepSalon, stepTime, stepExpert, stepConfirm][st.step](s);
  return {
    title: 'Book an appointment', role: 'customer',
    html: topNav('book') + `<div class="cust-in">
      <h1 class="title" style="margin-bottom:6px">Book your hair appointment</h1><p class="muted" style="margin:0 0 20px">Arman Hair Studio experts, at a partner salon near you.</p>
      <ol class="steps">${STEPS.map((n, i) => `<li class="${i + 1 < st.step ? 'done' : i + 1 === st.step ? 'cur' : ''}" ${i + 1 === st.step ? 'aria-current="step"' : ''}><b>${i + 1 < st.step ? '✓' : i + 1}</b><span>${n}</span></li>`).join('')}</ol>
      <div class="book-layout"><section class="panel">${body}</section>${summary(s)}</div></div>`,
    actions: acts,
    input: { name: (el) => { st.name = el.value; }, phone: (el) => { st.phone = el.value; } },
  };
}

const acts = {
  cat(el) { st.cat = el.dataset.v; D.refresh(); },
  svc(el) { st.serviceId = el.dataset.id; st.step = 2; st.start = null; D.refresh(); },
  salon(el) { st.salonId = el.dataset.id; st.step = 3; st.start = null; D.refresh(); },
  day(el) { st.date = el.dataset.d; st.start = null; D.refresh(); },
  time(el) {
    const s = D.db(); const start = +el.dataset.start;
    const o = D.findOptions(s, { serviceId: st.serviceId, date: st.date, salonId: st.salonId === 'any' ? undefined : st.salonId, from: start, to: start })[0];
    if (!o) { toast('That time was just taken. Pick another.', 'bad'); D.refresh(); return; }
    dropHold(s); st.start = start; st.expertId = 'auto'; st.hold = D.hold(s, o); st.step = 4; D.refresh();
  },
  ex(el) {
    const s = D.db(); const id = el.dataset.id; const h = st.hold;
    if (id === 'auto') { st.expertId = 'auto'; D.refresh(); return; }
    const f = D.expertFree(s, id, h.salonId, h.date, h.start, h.end, { holdId: h.id });
    if (!f.ok) { toast('That expert was just booked. Choose another.', 'bad'); D.refresh(); return; }
    h.expertId = id; h.travel = f.travel; st.expertId = id; D.save();
  },
  next() { st.step = 5; D.refresh(); },
  back() { const s = D.db(); if (st.step === 4) { dropHold(s); st.start = null; } st.step = Math.max(1, st.step - 1); D.refresh(); },
  pay(el) { st.pay = el.dataset.v; D.refresh(); },
  confirm() {
    const s = D.db(); const phone = st.phone.replace(/\D/g, '');
    if (!st.name.trim()) { toast('Enter your name', 'bad'); document.getElementById('c-name')?.focus(); return; }
    if (phone.length !== 10) { toast('Enter a 10-digit mobile number', 'bad'); document.getElementById('c-phone')?.focus(); return; }
    const r = D.confirm(s, st.hold, { name: st.name.trim(), phone }, 'online', st.pay === 'online' ? 'paid' : 'pending');
    if (!r.ok) { toast(r.reason, 'bad'); st.hold = null; st.step = 3; st.start = null; D.refresh(); return; }
    hist.phone = phone; st.done = r.booking.id; st.hold = null; D.refresh();
  },
  print() { window.print(); },
  again() { reset(); D.refresh(); },
};

function historyView() {
  const s = D.db(); const phone = hist.phone.replace(/\D/g, '');
  const list = phone.length === 10 ? s.bookings.filter((b) => b.customer.phone === phone).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)) : [];
  const cutoff = (b) => b.date > D.today() || (b.date === D.today() && b.start - D.nowMin() > 120);
  return {
    title: 'My bookings', role: 'customer',
    html: topNav('history') + `<div class="cust-in" style="max-width:760px">
      <h1 class="title" style="margin-bottom:16px">My bookings</h1>
      <div class="panel" style="margin-bottom:16px"><label class="field"><span>Mobile number used for booking</span><div class="row"><input class="input" id="h-phone" inputmode="tel" value="${esc(hist.phone)}" placeholder="10-digit mobile"><button class="btn primary" data-act="find">Show bookings</button></div></label></div>
      ${phone.length !== 10 ? '' : list.length ? `<div class="panel flush"><div class="table-wrap"><table class="t"><thead><tr><th>When</th><th>Service</th><th>Salon</th><th class="r">Amount</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map((b) => `<tr><td><b>${fmtDate(b.date)}</b><div class="cell-sub">${D.hm12(b.start)}</div></td><td>${esc(D.svc(b.serviceId, s).name)}<div class="cell-sub">${b.id}</div></td><td>${esc(D.salon(b.salonId, s).name)}</td><td class="r num">${D.inr(b.split.price)}</td><td>${badge(b.status)}</td><td>${b.status === 'confirmed' && cutoff(b) ? `<button class="btn sm danger" data-act="cancel" data-id="${b.id}">Cancel</button>` : ''}</td></tr>`).join('')}
      </tbody></table></div></div>` : `<div class="panel">${empty('No bookings for this number', 'Check the number, or book your first appointment.', '<a class="btn primary" href="#/book">Book an appointment</a>')}</div>`}
    </div>`,
    actions: {
      find() { hist.phone = document.getElementById('h-phone').value; D.refresh(); },
      cancel(el) { if (!confirm('Cancel this appointment?')) return; D.setStatus(D.db(), el.dataset.id, 'cancelled'); toast('Booking cancelled'); },
    },
    mount(root) { root.querySelector('#h-phone')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') root.querySelector('[data-act="find"]').click(); }); },
  };
}

export default function customer(parts) { return parts[0] === 'history' ? historyView() : bookView(); }
