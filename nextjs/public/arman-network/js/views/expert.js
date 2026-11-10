import * as D from '../data.js';
import { esc, badge, icon, toast, fmtDate, empty } from '../ui.js';

const ui = { expertId: 'rohan', open: null };
const TABS = [['today', 'Today', 'clock'], ['upcoming', 'Upcoming', 'calendar'], ['earnings', 'Earnings', 'wallet'], ['profile', 'Profile', 'user']];

function job(s, b, ex) {
  const sv = D.svc(b.serviceId, s), sal = D.salon(b.salonId, s), ch = D.chairOf(b, s);
  const live = ['checkedin', 'inservice'].includes(b.status);
  const isToday = b.date === D.today();
  let act = '';
  if (isToday && b.status === 'confirmed') act = `<button class="btn primary" data-act="st" data-id="${b.id}" data-v="checkedin">${icon('pin')}Check in at salon</button>`;
  if (b.status === 'checkedin') act = `<button class="btn primary" data-act="st" data-id="${b.id}" data-v="inservice">Start service</button>`;
  if (b.status === 'inservice') act = `<button class="btn gold" data-act="done" data-id="${b.id}">${icon('check')}Complete job</button>`;
  const prodEditor = b.status === 'inservice' ? `<div style="margin-top:12px;border-top:1px dashed var(--line);padding-top:10px"><div class="muted" style="font-size:12.5px;font-weight:600;margin-bottom:6px">Salon products used</div>
    ${Object.keys(sal.rates).map((k) => { const q = b.productsUsed.find((p) => p.id === k)?.qty || 0; return `<div class="row spread" style="padding:4px 0"><span>${esc(s.catalog[k].name)}<div class="cell-sub">${D.inr(sal.rates[k])} / ${esc(s.catalog[k].unit)}</div></span><span class="qty"><button data-act="qty" data-id="${b.id}" data-p="${k}" data-d="-1" aria-label="Less">−</button><span>${q}</span><button data-act="qty" data-id="${b.id}" data-p="${k}" data-d="1" aria-label="More">+</button></span></div>`; }).join('')}</div>` : '';
  return `<article class="job ${live ? 'current' : ''}"><div class="row spread"><span class="when">${D.hm12(b.start)} – ${D.hm12(b.end)}</span>${badge(b.status)}</div>
    <div style="font-weight:700;margin-top:6px">${esc(sv.name)}</div>
    <div class="muted" style="font-size:13px">Client: ${esc(b.customer.name)}</div>
    <div class="muted" style="font-size:13px">${esc(sal.name)}, ${esc(sal.area)} · ${esc(ch?.name || '')}</div>
    ${b.split.travel ? `<div style="font-size:12.5px;color:var(--warn);margin-top:4px">Travel allowance +${D.inr(b.split.travel)}</div>` : ''}
    ${prodEditor}${act ? `<div class="row wrap" style="margin-top:12px">${act}</div>` : ''}</article>`;
}

function body(s, ex, tab) {
  const t = D.today();
  const mine = s.bookings.filter((b) => b.expertId === ex.id && b.status !== 'cancelled');
  if (tab === 'today') {
    const list = mine.filter((b) => b.date === t).sort((a, b) => a.start - b.start);
    const left = list.filter((b) => b.status !== 'completed');
    return `<h2 class="h2" style="margin-bottom:4px">${fmtDate(t, { weekday: 'long', day: 'numeric', month: 'long' })}</h2><p class="muted" style="margin:0 0 14px">${left.length} of ${list.length} jobs left</p>
      ${list.length ? list.map((b) => job(s, b, ex)).join('') : empty('No jobs today', ex.status === 'active' ? 'New bookings will appear here.' : 'You are marked on leave, so no new jobs are assigned.')}`;
  }
  if (tab === 'upcoming') {
    const list = mine.filter((b) => b.date > t).sort((a, b) => (a.date + D.pad(a.start)).localeCompare(b.date + D.pad(b.start)));
    if (!list.length) return empty('Nothing scheduled yet', 'Upcoming jobs appear here as customers book.');
    const days = [...new Set(list.map((b) => b.date))];
    return days.map((d) => `<h2 class="h2" style="margin:14px 0 8px">${fmtDate(d)}</h2>${list.filter((b) => b.date === d).map((b) => job(s, b, ex)).join('')}`).join('');
  }
  if (tab === 'earnings') {
    const month = t.slice(0, 8);
    const done = mine.filter((b) => b.status === 'completed');
    const mth = done.filter((b) => b.date.startsWith(month));
    const p = D.payable(s, 'expert', ex.id);
    return `<div class="kpis" style="grid-template-columns:1fr 1fr"><div class="kpi"><div class="l">This month</div><div class="v num">${D.inr(mth.reduce((n, b) => n + b.split.expertPay + b.split.travel, 0))}</div><div class="d">${mth.length} jobs</div></div>
      <div class="kpi"><div class="l">Awaiting payout</div><div class="v num">${D.inr(p.amount)}</div><div class="d">${p.open.length} jobs</div></div></div>
      <h2 class="h2" style="margin:6px 0 8px">Recent jobs</h2>
      ${done.length ? `<table class="t"><tbody>${done.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25).map((b) => `<tr><td>${esc(D.svc(b.serviceId, s).name)}<div class="cell-sub">${fmtDate(b.date, { day: 'numeric', month: 'short' })} · ${esc(D.salon(b.salonId, s).name)}</div></td><td class="r num"><b>${D.inr(b.split.expertPay + b.split.travel)}</b>${b.split.travel ? '<div class="cell-sub">incl. travel</div>' : ''}</td></tr>`).join('')}</tbody></table>` : empty('No completed jobs yet', 'Earnings appear when you complete a job.')}
      ${p.history.length ? `<h2 class="h2" style="margin:16px 0 8px">Payouts received</h2><table class="t"><tbody>${p.history.slice().reverse().map((h) => `<tr><td>${fmtDate(h.date)}<div class="cell-sub">${h.bookingIds.length} jobs</div></td><td class="r num">${D.inr(h.amount)}</td></tr>`).join('')}</tbody></table>` : ''}`;
  }
  return `<dl class="kv"><dt>Name</dt><dd>${esc(ex.name)}</dd><dt>Mobile</dt><dd>${esc(ex.phone)}</dd><dt>Based in</dt><dd>${esc(ex.home)}</dd><dt>Hours</dt><dd>${D.hm12(ex.start)}–${D.hm12(ex.end)}</dd><dt>Rating</dt><dd>★ ${ex.rating}</dd></dl>
    <h2 class="h2" style="margin:18px 0 8px">Services you can take</h2><div>${ex.skills.map((k) => s.services.filter((v) => v.skill === k).map((v) => `<span class="chip">${esc(v.name)}</span>`).join('')).join('')}</div>
    <p class="muted" style="font-size:12.5px;margin-top:16px">Skills and hours are managed by Arman. Ask your manager to change them.</p>`;
}

export default function expert(parts) {
  const s = D.db(); const ex = D.expert(ui.expertId, s) || s.experts[0]; ui.expertId = ex.id;
  const tab = TABS.find((t) => t[0] === parts[0]) ? parts[0] : 'today';
  return {
    title: 'Expert app', role: 'expert',
    html: `<div class="phone">
      <header class="phone-top"><div class="row spread"><a href="#/" class="brand"><span class="brand-text" style="font-size:16px">ARMAN<small>EXPERT</small></span></a>
        <label><span class="sr">Expert</span><select data-change="who">${s.experts.map((x) => `<option value="${x.id}" ${x.id === ex.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label></div>
        <div class="row spread" style="margin-top:16px"><div><div style="font-family:var(--serif);font-size:22px">Hi, ${esc(ex.name.split(' ')[0])}</div><div style="color:var(--rail-dim);font-size:13px">${ex.status === 'active' ? 'Taking bookings' : 'On leave'}</div></div>
        <button class="switch" role="switch" aria-checked="${ex.status === 'active'}" aria-label="Available for bookings" data-act="avail"></button></div></header>
      <main class="phone-body">${body(s, ex, tab)}</main>
      <nav class="phone-tabs" aria-label="Expert app">${TABS.map(([id, l, ic]) => `<a href="#/expert/${id}" ${id === tab ? 'aria-current="page"' : ''}>${icon(ic)}${l}</a>`).join('')}</nav>
    </div>`,
    actions: {
      avail() { ex.status = ex.status === 'active' ? 'leave' : 'active'; D.save(); toast(ex.status === 'active' ? 'You are taking bookings' : 'Marked on leave. Existing jobs stay.'); },
      st(el) { D.setStatus(s, el.dataset.id, el.dataset.v); toast(el.dataset.v === 'checkedin' ? 'Checked in at salon' : 'Service started'); },
      qty(el) {
        const b = s.bookings.find((x) => x.id === el.dataset.id); const k = el.dataset.p;
        let p = b.productsUsed.find((x) => x.id === k); if (!p) { p = { id: k, qty: 0 }; b.productsUsed.push(p); }
        p.qty = Math.max(0, p.qty + +el.dataset.d); b.productsUsed = b.productsUsed.filter((x) => x.qty > 0);
        D.recalc(s, b); D.save();
      },
      done(el) { if (!confirm('Mark this job complete? The customer confirms the service is done.')) return; const b = s.bookings.find((x) => x.id === el.dataset.id); D.recalc(s, b); D.setStatus(s, b.id, 'completed'); toast('Job completed. Earnings updated.'); },
    },
    change: { who(el) { ui.expertId = el.value; D.refresh(); } },
  };
}
