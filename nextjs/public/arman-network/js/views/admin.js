import * as D from '../data.js';
import { esc, badge, shell, barChart, splitBar, toast, drawer, closeDrawer, fmtDate, empty, icon } from '../ui.js';
import { scheduleGrid, openNewBooking, dateNav, bookingRows, HEAD } from '../shared.js';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'schedule', label: 'Live schedule', icon: 'grid' },
  { id: 'bookings', label: 'Bookings', icon: 'calendar' },
  { id: 'salons', label: 'Salon partners', icon: 'store' },
  { id: 'experts', label: 'Experts', icon: 'users' },
  { id: 'services', label: 'Services & pricing', icon: 'tag' },
  { id: 'finance', label: 'Finance & settlements', icon: 'wallet' },
  { id: 'reports', label: 'Reports', icon: 'chart' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
].map((n) => ({ ...n, href: '#/admin/' + n.id }));

const ui = { range: 30, salonId: 'mantra', date: null, f: { when: 'upcoming', salon: '', expert: '', status: '', q: '' }, rep: 30 };
const page = (active, title, sub, content, actions = '') => shell({ portal: 'Super Admin', portalIcon: 'crown', nav: NAV, active, title, sub, content, actions });

// ---------------- Dashboard ----------------
function dashboard(s) {
  const t = D.today(), from = D.addDays(t, -(ui.range - 1));
  const list = s.bookings.filter((b) => D.inRange(b, from, t));
  const tot = D.totals(list);
  const prevList = s.bookings.filter((b) => D.inRange(b, D.addDays(from, -ui.range), D.addDays(from, -1)));
  const prev = D.totals(prevList);
  const delta = (a, b) => (b ? `${a >= b ? '+' : ''}${Math.round(((a - b) / b) * 100)}% vs previous ${ui.range} days` : '');
  const pend = s.salons.reduce((n, x) => n + D.payable(s, 'salon', x.id).amount, 0) + s.experts.reduce((n, x) => n + D.payable(s, 'expert', x.id).amount, 0);
  const days = Array.from({ length: ui.range }, (_, i) => D.addDays(from, i));
  const trend = days.map((d) => ({ label: fmtDate(d, { day: 'numeric', month: 'short' }), tip: fmtDate(d), value: s.bookings.filter((b) => b.date === d && b.status !== 'cancelled').length }));
  const todays = s.bookings.filter((b) => b.date === t && b.status !== 'cancelled').sort((a, b) => a.start - b.start);
  const pending = s.salons.filter((x) => x.status === 'pending');
  const content = `
    ${pending.length ? `<div class="panel" style="margin-bottom:16px;border-color:#e8d3a3;background:#fffaf0"><div class="row spread wrap"><div><b>${pending.length} salon ${pending.length > 1 ? 'partners are' : 'partner is'} waiting for approval</b><div class="muted">${pending.map((x) => esc(x.name) + ', ' + esc(x.area)).join(' · ')}</div></div><a class="btn" href="#/admin/salons">Review</a></div></div>` : ''}
    <div class="kpis">
      <div class="kpi"><div class="l">Bookings</div><div class="v num">${tot.count - list.filter((b) => b.status === 'cancelled').length}</div><div class="d">${delta(tot.count, prev.count)}</div></div>
      <div class="kpi"><div class="l">Revenue</div><div class="v num">${D.inr(tot.revenue)}</div><div class="d">${delta(tot.revenue, prev.revenue)}</div></div>
      <div class="kpi"><div class="l">Arman contribution</div><div class="v num">${D.inr(tot.arman)}</div><div class="d">${tot.revenue ? Math.round((tot.arman / tot.revenue) * 100) : 0}% of revenue</div></div>
      <div class="kpi"><div class="l">Pending settlements</div><div class="v num">${D.inr(pend)}</div><div class="d">Salons and experts</div></div>
      <div class="kpi"><div class="l">Network</div><div class="v num">${s.salons.filter((x) => x.status === 'approved').length} salons</div><div class="d">${s.experts.filter((x) => x.status === 'active').length} of ${s.experts.length} experts working</div></div>
    </div>
    <div class="grid g-main">
      <section class="panel"><div class="panel-head"><h2 class="h2">Bookings per day</h2><span class="muted" style="font-size:12.5px">Excludes cancelled</span></div>${barChart(trend, { color: 'var(--ink)', fmt: (v) => v + ' bookings' })}</section>
      <section class="panel"><div class="panel-head"><h2 class="h2">Where the money goes</h2><span class="muted" style="font-size:12.5px">Last ${ui.range} days</span></div>${splitBar(tot)}</section>
    </div>
    <div class="grid g-main" style="margin-top:16px">
      <section class="panel flush"><div class="panel-head"><h2 class="h2">Today, ${fmtDate(t)}</h2><a class="btn sm" href="#/admin/schedule">Open live schedule</a></div>
        ${todays.length ? `<div class="table-wrap"><table class="t"><thead><tr>${['when', 'customer', 'service', 'salon', 'expert', 'status'].map((k) => `<th>${HEAD[k]}</th>`).join('')}</tr></thead><tbody>${bookingRows(s, todays, { cols: ['when', 'customer', 'service', 'salon', 'expert', 'status'] })}</tbody></table></div>` : empty('No bookings today', 'New bookings appear here as customers book.')}</section>
      <section class="panel"><h2 class="h2" style="margin-bottom:12px">Quick actions</h2><div class="grid g2" style="gap:8px">
        <a class="btn" href="#/admin/schedule">${icon('plus')}New booking</a><a class="btn" href="#/admin/salons">${icon('store')}Onboard salon</a>
        <a class="btn" href="#/admin/experts">${icon('users')}Manage experts</a><a class="btn" href="#/admin/services">${icon('tag')}Update pricing</a>
        <a class="btn" href="#/admin/finance">${icon('wallet')}Process settlements</a><a class="btn" href="#/admin/reports">${icon('download')}Download reports</a></div></section>
    </div>`;
  return page('dashboard', 'Network overview', `Last ${ui.range} days across all partner salons`, content,
    `<div class="seg" role="group" aria-label="Range">${[7, 30].map((r) => `<button data-act="range" data-v="${r}" aria-pressed="${ui.range === r}">${r} days</button>`).join('')}</div>`);
}

// ---------------- Live schedule ----------------
function schedule(s) {
  ui.date = ui.date || D.today();
  const approved = s.salons.filter((x) => x.status === 'approved');
  if (!approved.find((x) => x.id === ui.salonId)) ui.salonId = approved[0]?.id;
  const day = s.bookings.filter((b) => b.date === ui.date && b.salonId === ui.salonId && b.status !== 'cancelled');
  const sal = D.salon(ui.salonId, s);
  const content = `<div class="filters">
      <label class="field"><span>Salon</span><select class="input" data-change="salon">${approved.map((x) => `<option value="${x.id}" ${x.id === ui.salonId ? 'selected' : ''}>${esc(x.name)}, ${esc(x.area)}</option>`).join('')}</select></label>
      <div class="field"><span>Date</span>${dateNav(ui.date)}</div>
      <div class="field" style="margin-left:auto"><span>&nbsp;</span><div class="muted">${day.length} ${day.length === 1 ? 'booking' : 'bookings'} · open ${D.hm12(sal.open)}–${D.hm12(sal.close)} · ${D.BUFFER} min cleanup after each service</div></div>
    </div>
    ${scheduleGrid(s, { salonId: ui.salonId, date: ui.date, role: 'admin' })}
    <p class="muted" style="font-size:12.5px;margin-top:12px">Click a green slot to book a walk-in or phone customer onto that chair. Click a booking to check in, start, complete, reassign or cancel it.</p>`;
  return page('schedule', 'Live seat schedule', 'Every chair, every booking, held seats and salon blocks in one view', content);
}

// ---------------- Bookings ----------------
function bookings(s) {
  const t = D.today(), f = ui.f;
  let list = s.bookings.slice();
  if (f.when === 'today') list = list.filter((b) => b.date === t);
  if (f.when === 'upcoming') list = list.filter((b) => b.date >= t && !['completed', 'cancelled', 'noshow'].includes(b.status));
  if (f.when === 'past') list = list.filter((b) => b.date < t || b.status === 'completed');
  if (f.salon) list = list.filter((b) => b.salonId === f.salon);
  if (f.expert) list = list.filter((b) => b.expertId === f.expert);
  if (f.status) list = list.filter((b) => b.status === f.status);
  if (f.q) { const q = f.q.toLowerCase(); list = list.filter((b) => (b.id + b.customer.name + b.customer.phone).toLowerCase().includes(q)); }
  list.sort((a, b) => (f.when === 'past' ? -1 : 1) * (a.date + D.pad(a.start)).localeCompare(b.date + D.pad(b.start)));
  const sel = (name, opts, v) => `<select class="input" data-change="f" data-k="${name}">${opts.map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const content = `<div class="filters">
    <div class="field"><span>Show</span><div class="seg">${[['today', 'Today'], ['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']].map(([k, l]) => `<button data-act="when" data-v="${k}" aria-pressed="${f.when === k}">${l}</button>`).join('')}</div></div>
    <label class="field"><span>Salon</span>${sel('salon', [['', 'All salons'], ...s.salons.map((x) => [x.id, x.name])], f.salon)}</label>
    <label class="field"><span>Expert</span>${sel('expert', [['', 'All experts'], ...s.experts.map((x) => [x.id, x.name])], f.expert)}</label>
    <label class="field"><span>Status</span>${sel('status', [['', 'Any status'], ...Object.entries(D.STATUS_LABEL)], f.status)}</label>
    <label class="field grow"><span>Search</span><input class="input" data-change="q" value="${esc(f.q)}" placeholder="Name, mobile or booking ID"></label></div>
    <div class="panel flush">${list.length ? `<div class="table-wrap"><table class="t"><thead><tr>${['when', 'id', 'customer', 'service', 'salon', 'expert', 'price', 'status'].map((k) => `<th>${HEAD[k]}</th>`).join('')}</tr></thead><tbody>${bookingRows(s, list.slice(0, 200), { cols: ['when', 'id', 'customer', 'service', 'salon', 'expert', 'price', 'status'] })}</tbody></table></div>` : empty('No bookings match these filters', 'Change the filters or open the live schedule to add one.')}</div>
    <p class="muted" style="font-size:12.5px">${list.length} bookings${list.length > 200 ? ', showing first 200' : ''}.</p>`;
  return page('bookings', 'Bookings', 'Search, filter and manage every appointment', content, '<a class="btn primary" href="#/admin/schedule">New booking</a>');
}

// ---------------- Salons ----------------
function salons(s) {
  const content = `<div class="panel flush"><div class="table-wrap"><table class="t"><thead><tr><th>Salon</th><th>Owner</th><th>Chairs</th><th>Hours</th><th class="r">Space fee</th><th class="r">Payable</th><th>Status</th><th></th></tr></thead><tbody>
    ${s.salons.map((x) => `<tr><td><b>${esc(x.name)}</b><div class="cell-sub">${esc(x.area)}</div></td><td>${esc(x.owner)}<div class="cell-sub">${esc(x.phone)}</div></td>
      <td>${x.chairs.filter((c) => c.active).length} active<div class="cell-sub">${x.chairs.filter((c) => c.wash).length} with wash</div></td><td class="num">${D.hm12(x.open)}–${D.hm12(x.close)}</td>
      <td class="r num">${D.inr(x.seatFee)}<div class="cell-sub">per booking</div></td><td class="r num">${D.inr(D.payable(s, 'salon', x.id).amount)}</td><td>${badge(x.status)}</td>
      <td class="r"><div class="row" style="justify-content:flex-end">${x.status === 'pending' ? `<button class="btn sm primary" data-act="sal-st" data-id="${x.id}" data-v="approved">Approve</button>` : x.status === 'approved' ? `<button class="btn sm" data-act="sal-st" data-id="${x.id}" data-v="suspended">Suspend</button>` : `<button class="btn sm" data-act="sal-st" data-id="${x.id}" data-v="approved">Reactivate</button>`}<button class="btn sm" data-act="sal-open" data-id="${x.id}">Details</button></div></td></tr>`).join('')}
    </tbody></table></div></div>`;
  return page('salons', 'Salon partners', 'Approve partners, set space fees and see their chairs', content, '<button class="btn primary" data-act="sal-new">Onboard salon</button>');
}
function salonDrawer(id) {
  const s = D.db(); const x = D.salon(id, s);
  drawer({
    title: esc(x.name), sub: esc(x.address),
    body: `<div class="stack"><dl class="kv"><dt>Owner</dt><dd>${esc(x.owner)}, ${esc(x.phone)}</dd><dt>Facilities</dt><dd>${x.facilities.map((f) => `<span class="chip">${esc(f)}</span>`).join('')}</dd></dl>
      <label class="field"><span>Space fee per booking (₹)</span><input class="input" type="number" min="0" id="sd-fee" value="${x.seatFee}"></label>
      <div class="grid g2"><label class="field"><span>Opens</span><input class="input" type="time" id="sd-open" value="${D.hm(x.open)}"></label><label class="field"><span>Closes</span><input class="input" type="time" id="sd-close" value="${D.hm(x.close)}"></label></div>
      <h3 class="h2" style="margin-top:8px">Chairs</h3>
      <table class="t"><tbody>${x.chairs.map((c) => `<tr><td>${esc(c.name)}</td><td>${c.wash ? 'Wash station' : 'Basic'}</td><td>${badge(c.active ? 'active' : 'suspended', c.active ? 'Active' : 'Inactive')}</td></tr>`).join('')}</tbody></table>
      <h3 class="h2" style="margin-top:8px">Product rates for Arman experts</h3>
      <table class="t"><tbody>${Object.entries(x.rates).map(([k, v]) => `<tr><td>${esc(s.catalog[k].name)}<div class="cell-sub">${esc(s.catalog[k].unit)}</div></td><td class="r num">${D.inr(v)}</td></tr>`).join('')}</tbody></table></div>`,
    footer: '<button class="btn" data-close>Close</button><button class="btn primary" id="sd-save">Save changes</button>',
    onMount(el) {
      el.querySelector('#sd-save').addEventListener('click', () => {
        const toM = (v) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
        const o = toM(el.querySelector('#sd-open').value), c = toM(el.querySelector('#sd-close').value);
        if (c <= o) { toast('Closing time must be after opening time', 'bad'); return; }
        x.seatFee = Math.max(0, +el.querySelector('#sd-fee').value || 0); x.open = o; x.close = c;
        D.save(); toast('Salon updated. New bookings use the new fee.'); closeDrawer();
      });
    },
  });
}
function newSalonDrawer() {
  drawer({
    title: 'Onboard a partner salon', sub: 'Added as pending until you approve it',
    body: `<div class="stack">${[['ns-name', 'Salon name'], ['ns-area', 'Area (e.g. Kolar Road)'], ['ns-addr', 'Full address'], ['ns-owner', 'Owner name'], ['ns-phone', 'Owner mobile']].map(([id, l]) => `<label class="field"><span>${l}</span><input class="input" id="${id}"></label>`).join('')}
      <div class="grid g2"><label class="field"><span>Chairs with wash station</span><input class="input" type="number" id="ns-w" value="1" min="0"></label><label class="field"><span>Basic chairs</span><input class="input" type="number" id="ns-b" value="1" min="0"></label></div>
      <label class="field"><span>Space fee per booking (₹)</span><input class="input" type="number" id="ns-fee" value="350"></label></div>`,
    footer: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="ns-go">Add salon</button>',
    onMount(el) {
      el.querySelector('#ns-go').addEventListener('click', () => {
        const v = (id) => el.querySelector('#' + id).value.trim();
        if (!v('ns-name') || !v('ns-area')) { toast('Enter the salon name and area', 'bad'); return; }
        const w = +v('ns-w') || 0, b = +v('ns-b') || 0; if (w + b < 1) { toast('Add at least one chair', 'bad'); return; }
        const s = D.db(); let n = 0;
        const chairs = [...Array(w)].map(() => ({ id: 'c' + (++n), name: `Chair ${D.pad(n)}`, wash: true, active: true })).concat([...Array(b)].map(() => ({ id: 'c' + (++n), name: `Chair ${D.pad(n)}`, wash: false, active: true })));
        s.salons.push({ id: 's' + Date.now(), name: v('ns-name'), area: v('ns-area'), address: v('ns-addr') || v('ns-area'), owner: v('ns-owner'), phone: v('ns-phone'), status: 'pending', open: 600, close: 1260, seatFee: +v('ns-fee') || 0, chairs, facilities: w ? ['Wash station'] : [], rates: { ...s.salons[0].rates } });
        D.save(); toast('Salon added as pending'); closeDrawer();
      });
    },
  });
}

// ---------------- Experts ----------------
function experts(s) {
  const t = D.today();
  const content = `<div class="panel flush"><div class="table-wrap"><table class="t"><thead><tr><th>Expert</th><th>Skills</th><th>Hours</th><th>Today</th><th class="r">Unsettled</th><th>Status</th><th></th></tr></thead><tbody>
    ${s.experts.map((x) => { const today = s.bookings.filter((b) => b.expertId === x.id && b.date === t && b.status !== 'cancelled'); return `<tr><td><b>${esc(x.name)}</b><div class="cell-sub">${esc(x.phone)} · based in ${esc(x.home)} · ★ ${x.rating}</div></td>
      <td>${x.skills.map((k) => `<span class="chip">${esc(s.services.find((v) => v.skill === k)?.name || k)}</span>`).join('')}</td><td class="num">${D.hm12(x.start)}–${D.hm12(x.end)}</td>
      <td>${today.length} jobs</td><td class="r num">${D.inr(D.payable(s, 'expert', x.id).amount)}</td><td>${badge(x.status, x.status === 'leave' ? 'On leave' : 'Working')}</td>
      <td class="r"><button class="btn sm" data-act="ex-open" data-id="${x.id}">Edit</button></td></tr>`; }).join('')}
    </tbody></table></div></div>
    <p class="muted" style="font-size:12.5px">The booking engine only offers an expert for a service they are skilled in, during their hours, with ${D.BUFFER} min between jobs at the same salon and 45 min when they move to another salon (₹${D.TRAVEL_FEE} travel paid).</p>`;
  return page('experts', 'Experts', 'Your five Arman experts, their skills, hours and availability', content);
}
function expertDrawer(id) {
  const s = D.db(); const x = D.expert(id, s);
  const skills = [...new Set(s.services.map((v) => v.skill))];
  drawer({
    title: esc(x.name), sub: `Based in ${esc(x.home)}`,
    body: `<div class="stack"><label class="field"><span>Status</span><select class="input" id="xd-st"><option value="active" ${x.status === 'active' ? 'selected' : ''}>Working</option><option value="leave" ${x.status === 'leave' ? 'selected' : ''}>On leave (no new bookings)</option></select></label>
      <div class="grid g2"><label class="field"><span>Starts</span><input class="input" type="time" id="xd-a" value="${D.hm(x.start)}"></label><label class="field"><span>Ends</span><input class="input" type="time" id="xd-b" value="${D.hm(x.end)}"></label></div>
      <fieldset style="border:0;padding:0;margin:0"><legend class="field" style="margin-bottom:6px"><span>Skills (services this expert can be booked for)</span></legend>
      ${skills.map((k) => `<label class="row" style="padding:5px 0"><input type="checkbox" value="${k}" ${x.skills.includes(k) ? 'checked' : ''}> ${esc(s.services.filter((v) => v.skill === k).map((v) => v.name).join(', '))}</label>`).join('')}</fieldset></div>`,
    footer: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="xd-save">Save expert</button>',
    onMount(el) {
      el.querySelector('#xd-save').addEventListener('click', () => {
        const toM = (v) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
        const sk = [...el.querySelectorAll('input[type=checkbox]:checked')].map((i) => i.value);
        if (!sk.length) { toast('Pick at least one skill', 'bad'); return; }
        x.status = el.querySelector('#xd-st').value; x.skills = sk; x.start = toM(el.querySelector('#xd-a').value); x.end = toM(el.querySelector('#xd-b').value);
        D.save(); toast('Expert saved'); closeDrawer();
      });
    },
  });
}

// ---------------- Services & pricing ----------------
function services(s) {
  const ref = D.salon('mantra', s) || s.salons[0];
  const content = `<div class="panel flush"><div class="table-wrap"><table class="t"><thead><tr><th>Service</th><th>Duration</th><th>Needs</th><th class="r">Customer price</th><th class="r">Expert payout</th><th class="r">Arman share*</th></tr></thead><tbody>
    ${s.services.map((v) => { const sp = D.split(s, v, ref, false); return `<tr><td><b>${esc(v.name)}</b><div class="cell-sub">${esc(v.desc)}</div></td><td>${v.duration} min</td><td>${v.wash ? 'Wash station' : 'Any chair'}${v.products.length ? `<div class="cell-sub">${v.products.map((p) => esc(s.catalog[p.id].name)).join(', ')}</div>` : ''}</td>
      <td class="r"><input class="input num" style="width:110px;text-align:right" type="number" min="0" step="50" value="${v.price}" data-change="price" data-id="${v.id}" aria-label="${esc(v.name)} price"></td>
      <td class="r"><input class="input num" style="width:100px;text-align:right" type="number" min="0" step="50" value="${v.expertPay}" data-change="epay" data-id="${v.id}" aria-label="${esc(v.name)} expert payout"></td>
      <td class="r num" style="color:${sp.arman < 0 ? 'var(--bad)' : 'inherit'}"><b>${D.inr(sp.arman)}</b><div class="cell-sub">${Math.round((sp.arman / v.price) * 100)}%</div></td></tr>`; }).join('')}
    </tbody></table></div></div>
    <p class="muted" style="font-size:12.5px">* Arman share shown for ${esc(ref.name)} (space fee ${D.inr(ref.seatFee)} + that salon's product rates), without travel. Price changes apply to new bookings only; existing bookings keep their agreed price.</p>`;
  return page('services', 'Services & pricing', 'Arman sets one price per service across every partner salon', content);
}

// ---------------- Finance ----------------
function finance(s) {
  const all = D.totals(s.bookings.filter((b) => b.date <= D.today()));
  const row = (kind, x, name, sub) => { const p = D.payable(s, kind, x.id); const last = p.history[p.history.length - 1];
    return `<tr><td><b>${esc(name)}</b><div class="cell-sub">${esc(sub)}</div></td><td>${p.open.length}</td><td class="r num"><b>${D.inr(p.amount)}</b></td><td>${last ? `${D.inr(last.amount)} on ${fmtDate(last.date, { day: 'numeric', month: 'short' })}` : '<span class="faint">Never</span>'}</td><td class="r"><button class="btn sm ${p.amount ? 'primary' : ''}" data-act="settle" data-kind="${kind}" data-id="${x.id}" ${p.amount ? '' : 'disabled'}>Settle ${p.amount ? D.inr(p.amount) : ''}</button></td></tr>`; };
  const hist = s.settlements.slice().reverse().slice(0, 12);
  const content = `<div class="kpis">
      <div class="kpi"><div class="l">Collected from customers</div><div class="v num">${D.inr(all.revenue)}</div><div class="d">Completed and upcoming</div></div>
      <div class="kpi"><div class="l">Refunds</div><div class="v num">${D.inr(all.refunds)}</div><div class="d">Cancelled after payment</div></div>
      <div class="kpi"><div class="l">Owed to salons</div><div class="v num">${D.inr(s.salons.reduce((n, x) => n + D.payable(s, 'salon', x.id).amount, 0))}</div><div class="d">Space fees + products</div></div>
      <div class="kpi"><div class="l">Owed to experts</div><div class="v num">${D.inr(s.experts.reduce((n, x) => n + D.payable(s, 'expert', x.id).amount, 0))}</div><div class="d">Payouts + travel</div></div>
      <div class="kpi"><div class="l">Arman contribution</div><div class="v num">${D.inr(all.arman)}</div><div class="d">After all payouts</div></div></div>
    <div class="grid g-main">
      <div class="stack" style="min-width:0">
        <section class="panel flush"><div class="panel-head"><h2 class="h2">Salon settlements</h2><span class="muted" style="font-size:12.5px">Completed services only</span></div><div class="table-wrap"><table class="t"><thead><tr><th>Salon</th><th>Jobs</th><th class="r">Payable</th><th>Last paid</th><th></th></tr></thead><tbody>${s.salons.filter((x) => x.status !== 'pending').map((x) => row('salon', x, x.name, x.area)).join('')}</tbody></table></div></section>
        <section class="panel flush"><div class="panel-head"><h2 class="h2">Expert payouts</h2></div><div class="table-wrap"><table class="t"><thead><tr><th>Expert</th><th>Jobs</th><th class="r">Payable</th><th>Last paid</th><th></th></tr></thead><tbody>${s.experts.map((x) => row('expert', x, x.name, x.home)).join('')}</tbody></table></div></section>
      </div>
      <div class="stack" style="min-width:0">
        <section class="panel"><h2 class="h2" style="margin-bottom:12px">Example: one ₹2,500 style booking</h2>${splitBar({ salonFee: 350, products: 250, expertPay: 750, travel: 150, arman: 1000 }, 2500)}<p class="muted" style="font-size:12.5px;margin:12px 0 0">Every booking stores its own split at the time it is made, so price changes never rewrite history.</p></section>
        <section class="panel flush"><div class="panel-head"><h2 class="h2">Settlement history</h2></div>${hist.length ? `<table class="t"><tbody>${hist.map((x) => `<tr><td>${esc(x.kind === 'salon' ? D.salon(x.partyId, s)?.name : D.expert(x.partyId, s)?.name)}<div class="cell-sub">${x.bookingIds.length} jobs · ${fmtDate(x.date)}</div></td><td class="r num">${D.inr(x.amount)}</td></tr>`).join('')}</tbody></table>` : empty('No settlements yet', 'Settle a salon or expert to record a payout here.')}</section>
      </div></div>`;
  return page('finance', 'Finance & settlements', 'What customers paid, what each partner and expert is owed, and what Arman keeps', content);
}

// ---------------- Reports ----------------
function reports(s) {
  const t = D.today(), from = D.addDays(t, -(ui.rep - 1));
  const list = s.bookings.filter((b) => D.inRange(b, from, t) && b.status !== 'cancelled');
  const by = (key, name) => { const m = new Map(); list.forEach((b) => { const k = b[key]; const o = m.get(k) || { n: 0, rev: 0, arman: 0 }; o.n++; o.rev += b.split.price; o.arman += b.split.arman; m.set(k, o); }); return [...m.entries()].map(([k, o]) => ({ name: name(k), ...o })).sort((a, b) => b.rev - a.rev); };
  const tbl = (title, rows) => `<section class="panel flush"><div class="panel-head"><h2 class="h2">${title}</h2></div><table class="t"><thead><tr><th></th><th class="r">Bookings</th><th class="r">Revenue</th><th class="r">Arman share</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.name)}</td><td class="r num">${r.n}</td><td class="r num">${D.inr(r.rev)}</td><td class="r num">${D.inr(r.arman)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">No data</td></tr>'}</tbody></table></section>`;
  const content = `<div class="grid g2">${tbl('By service', by('serviceId', (k) => D.svc(k, s).name))}${tbl('By salon', by('salonId', (k) => D.salon(k, s).name))}${tbl('By expert', by('expertId', (k) => D.expert(k, s).name))}
    <section class="panel"><h2 class="h2" style="margin-bottom:8px">Export</h2><p class="muted" style="margin:0 0 12px">Download every booking in this period with its full revenue split, for accounts or GST filing.</p><button class="btn primary" data-act="csv">${icon('download')}Download bookings CSV</button></section></div>`;
  return page('reports', 'Reports', `${fmtDate(from)} to ${fmtDate(t)}`, content,
    `<div class="seg" role="group" aria-label="Range">${[7, 30, 90].map((r) => `<button data-act="rep" data-v="${r}" aria-pressed="${ui.rep === r}">${r} days</button>`).join('')}</div>`);
}

// ---------------- Settings ----------------
function settings() {
  const rules = [['Cleanup buffer after each service', `${D.BUFFER} min`], ['Seat + expert hold while customer confirms', `${D.HOLD_MIN} min`], ['Expert travel time between salons', '30 min + buffer'], ['Travel allowance per cross-salon job', D.inr(D.TRAVEL_FEE)], ['Booking grid step', `${D.SLOT} min`], ['Earliest same-day booking', '30 min from now'], ['Customer self-cancel window', 'Up to 2 hours before']];
  const content = `<div class="grid g2"><section class="panel flush"><div class="panel-head"><h2 class="h2">Booking rules</h2></div><table class="t"><tbody>${rules.map(([a, b]) => `<tr><td>${a}</td><td class="r"><b>${b}</b></td></tr>`).join('')}</tbody></table></section>
    <section class="panel stack"><h2 class="h2">Users and roles</h2><p class="muted" style="margin:0">Phase 2 adds sign-in with Supabase Auth and row-level security: Super Admin sees everything, a salon partner sees only its own chairs, bookings and payouts, and an expert sees only their own jobs and earnings. Every status change is written to an audit log.</p>
    <h2 class="h2" style="margin-top:18px">Demo data</h2><p class="muted" style="margin:0">All screens currently use sample data saved in this browser.</p><div><button class="btn danger" data-act="reset">Reset demo data</button></div></section></div>`;
  return page('settings', 'Settings', 'Business rules the booking engine follows', content);
}

function csv(s) {
  const t = D.today(), from = D.addDays(t, -(ui.rep - 1));
  const head = ['booking_id', 'date', 'start', 'service', 'salon', 'chair', 'expert', 'customer', 'phone', 'status', 'payment', 'price', 'salon_fee', 'products', 'expert_payout', 'travel', 'arman_share'];
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = s.bookings.filter((b) => D.inRange(b, from, t)).map((b) => [b.id, b.date, D.hm(b.start), D.svc(b.serviceId, s).name, D.salon(b.salonId, s).name, b.chairId, D.expert(b.expertId, s).name, b.customer.name, b.customer.phone, b.status, b.payment, b.split.price, b.split.salonFee, b.split.products, b.split.expertPay, b.split.travel, b.split.arman].map(q).join(','));
  const url = URL.createObjectURL(new Blob([[head.join(','), ...rows].join('\n')], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = `arman-bookings-${from}-to-${t}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const PAGES = { dashboard, schedule, bookings, salons, experts, services, finance, reports, settings };
export default function admin(parts) {
  const s = D.db(); const id = PAGES[parts[0]] ? parts[0] : 'dashboard';
  return {
    title: NAV.find((n) => n.id === id).label, role: 'admin',
    html: PAGES[id](s),
    actions: {
      range(el) { ui.range = +el.dataset.v; D.refresh(); },
      rep(el) { ui.rep = +el.dataset.v; D.refresh(); },
      date(el) { ui.date = el.dataset.d; D.refresh(); },
      slot(el) { openNewBooking({ salonId: el.dataset.salon, chairId: el.dataset.chair, date: ui.date, start: +el.dataset.start }); },
      when(el) { ui.f.when = el.dataset.v; D.refresh(); },
      'sal-st'(el) { const x = D.salon(el.dataset.id, s); if (el.dataset.v === 'suspended' && !confirm(`Suspend ${x.name}? Customers can no longer book its chairs. Existing bookings stay.`)) return; x.status = el.dataset.v; D.save(); toast(`${x.name}: ${el.dataset.v}`); },
      'sal-open'(el) { salonDrawer(el.dataset.id); },
      'sal-new'() { newSalonDrawer(); },
      'ex-open'(el) { expertDrawer(el.dataset.id); },
      settle(el) { const kind = el.dataset.kind, x = kind === 'salon' ? D.salon(el.dataset.id, s) : D.expert(el.dataset.id, s); const amt = D.payable(s, kind, x.id).amount; if (!confirm(`Record a payout of ${D.inr(amt)} to ${x.name}?`)) return; D.settle(s, kind, x.id); toast(`Settled ${D.inr(amt)} to ${x.name}`); },
      csv() { csv(s); },
      reset() { if (confirm('Reset all demo data in this browser?')) { D.resetDemo(); toast('Demo data reset'); } },
    },
    change: {
      salon(el) { ui.salonId = el.value; D.refresh(); },
      date(el) { if (el.value) { ui.date = el.value; D.refresh(); } },
      f(el) { ui.f[el.dataset.k] = el.value; D.refresh(); },
      q(el) { ui.f.q = el.value; D.refresh(); },
      price(el) { const v = D.svc(el.dataset.id, s); v.price = Math.max(0, +el.value || 0); D.save(); toast(`${v.name} now ${D.inr(v.price)}`); },
      epay(el) { const v = D.svc(el.dataset.id, s); v.expertPay = Math.max(0, +el.value || 0); D.save(); toast(`${v.name} expert payout now ${D.inr(v.expertPay)}`); },
    },
  };
}
