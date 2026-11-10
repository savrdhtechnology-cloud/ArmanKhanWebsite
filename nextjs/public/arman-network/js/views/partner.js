import * as D from '../data.js';
import { esc, badge, shell, barChart, toast, fmtDate, empty } from '../ui.js';
import { scheduleGrid, openBlock, dateNav, bookingRows, HEAD } from '../shared.js';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'schedule', label: 'Seat availability', icon: 'grid' },
  { id: 'bookings', label: 'Arman bookings', icon: 'calendar' },
  { id: 'chairs', label: 'Chairs & facilities', icon: 'chair' },
  { id: 'products', label: 'Products & rates', icon: 'box' },
  { id: 'payouts', label: 'Payouts & statements', icon: 'wallet' },
].map((n) => ({ ...n, href: '#/partner/' + n.id }));

const ui = { salonId: 'mantra', date: null };

function switcher(s) {
  return `<label class="switcher"><span class="sr">Salon</span><select data-change="who">${s.salons.map((x) => `<option value="${x.id}" ${x.id === ui.salonId ? 'selected' : ''}>${esc(x.name)}, ${esc(x.area)}</option>`).join('')}</select></label>`;
}
const page = (s, active, title, sub, content, actions = '') => shell({ portal: 'Salon Partner', portalIcon: 'store', nav: NAV, active, title, sub, content, actions, switcher: switcher(s) });

function dashboard(s, sal) {
  const t = D.today(), month = t.slice(0, 8);
  const mine = s.bookings.filter((b) => b.salonId === sal.id && b.status !== 'cancelled');
  const mth = mine.filter((b) => b.date.startsWith(month));
  const fees = mth.reduce((n, b) => n + b.split.salonFee, 0), prods = mth.reduce((n, b) => n + b.split.products, 0);
  const todays = mine.filter((b) => b.date === t).sort((a, b) => a.start - b.start);
  const days = Array.from({ length: 14 }, (_, i) => D.addDays(t, i - 13));
  const trend = days.map((d) => { const v = mine.filter((b) => b.date === d).reduce((n, b) => n + b.split.salonFee + b.split.products, 0); return { label: fmtDate(d, { day: 'numeric', month: 'short' }), tip: fmtDate(d), value: v }; });
  const content = `${sal.status !== 'approved' ? `<div class="panel" style="margin-bottom:16px;background:#fffaf0;border-color:#e8d3a3"><b>${sal.status === 'pending' ? 'Your salon is waiting for Arman approval.' : 'Your salon is suspended.'}</b><div class="muted">Customers cannot book your chairs until Arman ${sal.status === 'pending' ? 'approves' : 'reactivates'} it. You can still set up chairs and product rates.</div></div>` : ''}
    <div class="kpis">
      <div class="kpi"><div class="l">Bookings this month</div><div class="v num">${mth.length}</div><div class="d">${todays.length} today</div></div>
      <div class="kpi"><div class="l">Space fees</div><div class="v num">${D.inr(fees)}</div><div class="d">${D.inr(sal.seatFee)} per booking</div></div>
      <div class="kpi"><div class="l">Product charges</div><div class="v num">${D.inr(prods)}</div><div class="d">Used by Arman experts</div></div>
      <div class="kpi"><div class="l">Total earnings</div><div class="v num">${D.inr(fees + prods)}</div><div class="d">This month</div></div>
      <div class="kpi"><div class="l">Awaiting payout</div><div class="v num">${D.inr(D.payable(s, 'salon', sal.id).amount)}</div><div class="d">Completed services</div></div></div>
    <div class="grid g-main">
      <section class="panel flush"><div class="panel-head"><h2 class="h2">Today's Arman bookings</h2><a class="btn sm" href="#/partner/schedule">Seat availability</a></div>
        ${todays.length ? `<div class="table-wrap"><table class="t"><thead><tr>${['when', 'service', 'chair', 'expert', 'status'].map((k) => `<th>${HEAD[k]}</th>`).join('')}</tr></thead><tbody>${bookingRows(s, todays, { cols: ['when', 'service', 'chair', 'expert', 'status'] })}</tbody></table></div>` : empty('No Arman bookings today', 'Keep chairs active and unblocked so customers can book them.')}</section>
      <section class="panel"><div class="panel-head"><h2 class="h2">Daily earnings</h2><span class="muted" style="font-size:12.5px">Last 14 days</span></div>${barChart(trend, { color: 'var(--s1)', fmt: (v) => D.inr(v) })}</section>
    </div>`;
  return page(s, 'dashboard', esc(sal.name), `${esc(sal.address)} · open ${D.hm12(sal.open)}–${D.hm12(sal.close)}`, content);
}

function schedule(s, sal) {
  ui.date = ui.date || D.today();
  const content = `<div class="filters"><div class="field"><span>Date</span>${dateNav(ui.date)}</div></div>
    ${scheduleGrid(s, { salonId: sal.id, date: ui.date, role: 'partner' })}
    <p class="muted" style="font-size:12.5px;margin-top:12px">Click a green slot to block a chair for your own client or maintenance. Arman can book any active, unblocked chair during your open hours.</p>`;
  return page(s, 'schedule', 'Seat availability', 'Live view of your chairs for Arman bookings', content);
}

function bookings(s, sal) {
  const list = s.bookings.filter((b) => b.salonId === sal.id).sort((a, b) => (b.date + D.pad(b.start)).localeCompare(a.date + D.pad(a.start)));
  const cols = ['when', 'id', 'service', 'chair', 'expert', 'fee', 'status'];
  const content = `<div class="panel flush">${list.length ? `<div class="table-wrap"><table class="t"><thead><tr>${cols.map((k) => `<th>${HEAD[k]}</th>`).join('')}</tr></thead><tbody>${bookingRows(s, list.slice(0, 200), { cols })}</tbody></table></div>` : empty('No bookings yet', 'Bookings appear here as soon as Arman customers book your chairs.')}</div>
    <p class="muted" style="font-size:12.5px">Customer contact details stay with Arman Hair Studio.</p>`;
  return page(s, 'bookings', 'Arman bookings', 'Every appointment held at your salon', content);
}

function chairs(s, sal) {
  const content = `<div class="grid g2"><section class="panel flush"><div class="panel-head"><h2 class="h2">Chairs / workstations</h2><button class="btn sm" data-act="add-chair">Add chair</button></div>
      <table class="t"><thead><tr><th>Chair</th><th>Wash station</th><th>Available to Arman</th></tr></thead><tbody>
      ${sal.chairs.map((c) => `<tr><td><b>${esc(c.name)}</b></td><td><button class="switch" role="switch" aria-checked="${c.wash}" aria-label="${esc(c.name)} wash station" data-act="wash" data-id="${c.id}"></button></td><td><button class="switch" role="switch" aria-checked="${c.active}" aria-label="${esc(c.name)} available" data-act="active" data-id="${c.id}"></button></td></tr>`).join('')}</tbody></table></section>
    <section class="panel stack"><h2 class="h2">Facilities</h2><div>${['Wash station', 'Steamer', 'Hood dryer', 'Bridal room', 'AC', 'Parking'].map((f) => `<label class="row" style="padding:5px 0"><input type="checkbox" data-change="fac" value="${esc(f)}" ${sal.facilities.includes(f) ? 'checked' : ''}> ${esc(f)}</label>`).join('')}</div>
      <h2 class="h2">Open hours</h2><div class="grid g2"><label class="field"><span>Opens</span><input class="input" type="time" value="${D.hm(sal.open)}" data-change="open"></label><label class="field"><span>Closes</span><input class="input" type="time" value="${D.hm(sal.close)}" data-change="close"></label></div>
      <p class="muted" style="font-size:12.5px;margin:0">Turning a chair off keeps existing bookings but stops new ones on it.</p></section></div>`;
  return page(s, 'chairs', 'Chairs & facilities', 'What Arman experts can use at your salon', content);
}

function products(s, sal) {
  const used = {}; s.bookings.filter((b) => b.salonId === sal.id && b.status === 'completed' && b.date.startsWith(D.today().slice(0, 8))).forEach((b) => b.productsUsed.forEach((p) => { used[p.id] = (used[p.id] || 0) + p.qty; }));
  const content = `<div class="panel flush"><table class="t"><thead><tr><th>Product</th><th>Unit</th><th class="r">Your rate to Arman</th><th class="r">Used this month</th><th class="r">Billed</th></tr></thead><tbody>
    ${Object.entries(sal.rates).map(([k, v]) => `<tr><td><b>${esc(s.catalog[k].name)}</b></td><td>${esc(s.catalog[k].unit)}</td><td class="r"><input class="input num" type="number" min="0" step="10" style="width:110px;text-align:right" value="${v}" data-change="rate" data-id="${k}" aria-label="${esc(s.catalog[k].name)} rate"></td><td class="r num">${used[k] || 0}</td><td class="r num">${D.inr((used[k] || 0) * v)}</td></tr>`).join('')}</tbody></table></div>
    <p class="muted" style="font-size:12.5px">Experts log the products they use on each job. Rate changes apply to new bookings.</p>`;
  return page(s, 'products', 'Products & rates', 'Salon products Arman experts may use, and what you charge for them', content);
}

function payouts(s, sal) {
  const p = D.payable(s, 'salon', sal.id);
  const content = `<div class="kpis"><div class="kpi"><div class="l">Awaiting payout</div><div class="v num">${D.inr(p.amount)}</div><div class="d">${p.open.length} completed services</div></div>
    <div class="kpi"><div class="l">Paid to date</div><div class="v num">${D.inr(p.history.reduce((n, h) => n + h.amount, 0))}</div><div class="d">${p.history.length} settlements</div></div></div>
    <div class="grid g2"><section class="panel flush"><div class="panel-head"><h2 class="h2">Not yet settled</h2></div>${p.open.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Service</th><th class="r">Space fee</th><th class="r">Products</th></tr></thead><tbody>${p.open.slice(-40).reverse().map((b) => `<tr><td>${fmtDate(b.date, { day: 'numeric', month: 'short' })}<div class="cell-sub">${b.id}</div></td><td>${esc(D.svc(b.serviceId, s).name)}</td><td class="r num">${D.inr(b.split.salonFee)}</td><td class="r num">${D.inr(b.split.products)}</td></tr>`).join('')}</tbody></table></div>` : empty('All settled', 'Completed services will appear here until Arman pays them out.')}</section>
    <section class="panel flush"><div class="panel-head"><h2 class="h2">Statements</h2></div>${p.history.length ? `<table class="t"><tbody>${p.history.slice().reverse().map((h) => `<tr><td>${fmtDate(h.date)}<div class="cell-sub">${h.bookingIds.length} services · ${h.id}</div></td><td class="r num"><b>${D.inr(h.amount)}</b></td><td>${badge('paid', 'Paid')}</td></tr>`).join('')}</tbody></table>` : empty('No payouts yet', 'Arman settles completed services on a regular cycle.')}</section></div>`;
  return page(s, 'payouts', 'Payouts & statements', 'Space fees and product charges Arman owes you', content);
}

const PAGES = { dashboard, schedule, bookings, chairs, products, payouts };
export default function partner(parts) {
  const s = D.db(); const sal = D.salon(ui.salonId, s) || s.salons[0]; ui.salonId = sal.id;
  const id = PAGES[parts[0]] ? parts[0] : 'dashboard';
  const toM = (v) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
  const ch = (id2) => sal.chairs.find((c) => c.id === id2);
  return {
    title: NAV.find((n) => n.id === id).label, role: 'partner',
    html: PAGES[id](s, sal),
    actions: {
      date(el) { ui.date = el.dataset.d; D.refresh(); },
      slot(el) { openBlock({ salonId: sal.id, chairId: el.dataset.chair, date: ui.date, start: +el.dataset.start }); },
      wash(el) { const c = ch(el.dataset.id); c.wash = !c.wash; D.save(); },
      active(el) { const c = ch(el.dataset.id); c.active = !c.active; D.save(); toast(`${c.name} ${c.active ? 'available' : 'turned off'} for Arman bookings`); },
      'add-chair'() { const n = sal.chairs.length + 1; sal.chairs.push({ id: 'c' + Date.now(), name: `Chair ${D.pad(n)}`, wash: false, active: true }); D.save(); toast(`Chair ${D.pad(n)} added`); },
    },
    change: {
      who(el) { ui.salonId = el.value; D.refresh(); },
      date(el) { if (el.value) { ui.date = el.value; D.refresh(); } },
      fac(el) { sal.facilities = el.checked ? [...new Set([...sal.facilities, el.value])] : sal.facilities.filter((f) => f !== el.value); D.save(); },
      open(el) { const v = toM(el.value); if (v >= sal.close) { toast('Opening must be before closing', 'bad'); D.refresh(); return; } sal.open = v; D.save(); toast('Hours updated'); },
      close(el) { const v = toM(el.value); if (v <= sal.open) { toast('Closing must be after opening', 'bad'); D.refresh(); return; } sal.close = v; D.save(); toast('Hours updated'); },
      rate(el) { sal.rates[el.dataset.id] = Math.max(0, +el.value || 0); D.save(); toast('Rate updated'); },
    },
  };
}
