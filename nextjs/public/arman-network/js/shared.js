import * as D from './data.js';
import { esc, badge, drawer, closeDrawer, toast, icon, fmtDate } from './ui.js';

const PX = 30; // px per 15 minutes

/** Live seat grid for one salon and day: chairs as rows, time across. */
export function scheduleGrid(s, { salonId, date, role }) {
  const sal = D.salon(salonId, s);
  if (!sal) return '';
  const span = sal.close - sal.open, width = (span / D.SLOT) * PX;
  const x = (m) => ((m - sal.open) / D.SLOT) * PX;
  let head = '';
  for (let t = sal.open; t < sal.close; t += 30) head += `<div class="hd ${t % 60 ? 'half' : ''}" style="position:absolute;left:${x(t)}px;width:${PX * 2}px;top:0">${t % 60 ? '' : D.hm12(t).replace(':00', '')}</div>`;
  const now = D.nowMin();
  const showNow = date === D.today() && now > sal.open && now < sal.close;
  const holds = s.holds.filter((h) => h.expires > Date.now() && h.salonId === salonId && h.date === date);

  const lanes = sal.chairs.map((c) => {
    const items = [];
    s.bookings.filter((b) => b.salonId === salonId && b.chairId === c.id && b.date === date && b.status !== 'cancelled').forEach((b) => {
      const sv = D.svc(b.serviceId, s), ex = D.expert(b.expertId, s);
      const cls = b.status === 'completed' ? 'done' : ['checkedin', 'inservice'].includes(b.status) ? 'live' : '';
      const who = role === 'partner' ? `Arman expert: ${ex?.name.split(' ')[0]}` : `${b.customer.name} · ${ex?.name.split(' ')[0]}`;
      items.push(`<button class="blk booked ${cls}" style="left:${x(b.start)}px;width:${x(b.end) - x(b.start)}px" data-act="booking" data-id="${b.id}" aria-label="${esc(sv.name)} ${D.hm12(b.start)}"><b>${esc(sv.name)}</b><span>${esc(who)}</span></button>`);
    });
    holds.filter((h) => h.chairId === c.id).forEach((h) => items.push(`<div class="blk held" style="left:${x(h.start)}px;width:${x(h.end) - x(h.start)}px"><b>Held</b><span>${D.HOLD_MIN} min hold</span></div>`));
    s.blocks.filter((k) => k.salonId === salonId && k.chairId === c.id && k.date === date).forEach((k) => items.push(`<button class="blk blocked" style="left:${x(k.start)}px;width:${x(k.end) - x(k.start)}px" data-act="block" data-id="${k.id}"><b>Blocked</b><span>${esc(k.reason)}</span></button>`));
    let free = '';
    if (c.active) {
      for (let t = sal.open; t < sal.close; t += D.SLOT) {
        if (date === D.today() && t + D.SLOT <= now) continue;
        if (D.chairBusy(s, salonId, c.id, date, t, t + D.SLOT - D.BUFFER)) continue;
        free += `<button class="slot" style="left:${x(t) + 1}px;width:${PX - 2}px" data-act="slot" data-salon="${salonId}" data-chair="${c.id}" data-start="${t}" aria-label="${esc(c.name)} free at ${D.hm12(t)}" title="${D.hm12(t)} · free"></button>`;
      }
    } else free = `<div class="slot off" style="left:0;width:${width}px"></div>`;
    return `<div class="lbl"><b>${esc(c.name)}</b><small>${c.wash ? 'With wash station' : 'Basic'}${c.active ? '' : ' · inactive'}</small></div>
      <div class="lane" style="width:${width}px">${date < D.today() || showNow ? `<div class="past" style="width:${date < D.today() ? width : x(now)}px"></div>` : ''}${free}${items.join('')}${showNow ? `<div class="now-line" style="left:${x(now)}px"></div>` : ''}</div>`;
  }).join('');
  return `<div class="sched" data-sched data-scroll="${showNow ? Math.max(0, x(now) - 140) : 0}"><div class="sched-grid" style="grid-template-columns:auto ${width}px">
    <div class="corner"></div><div style="position:relative;height:32px;width:${width}px;border-bottom:1px solid var(--line)">${head}</div>${lanes}</div></div>
    <div class="legend" style="margin-top:10px"><span><i style="background:var(--free);box-shadow:inset 0 0 0 1px var(--free-line)"></i>Available</span><span><i style="background:var(--held)"></i>Held (5 min)</span><span><i style="background:var(--booked)"></i>Booked</span><span><i style="background:#3d2f12;box-shadow:inset 3px 0 0 var(--gold)"></i>In salon now</span><span><i style="background:#5b574e"></i>Completed</span><span><i style="background:var(--blocked)"></i>Blocked by salon</span></div>`;
}

const NEXT = { confirmed: ['checkedin', 'Check in'], checkedin: ['inservice', 'Start service'], inservice: ['completed', 'Complete service'] };

export function openBooking(id, role = 'admin') {
  const s = D.db(); const b = s.bookings.find((x) => x.id === id); if (!b) return;
  const sv = D.svc(b.serviceId, s), sal = D.salon(b.salonId, s), ex = D.expert(b.expertId, s), ch = D.chairOf(b, s);
  const sp = b.split;
  const products = b.productsUsed.map((p) => `${s.catalog[p.id].name} × ${p.qty}`).join(', ') || 'None';
  const canEdit = role === 'admin' && !['completed', 'cancelled', 'noshow'].includes(b.status);
  let reassign = '';
  if (canEdit) {
    const free = s.experts.filter((x) => x.id !== b.expertId && x.status === 'active' && x.skills.includes(sv.skill) && D.expertFree(s, x.id, b.salonId, b.date, b.start, b.end, { bookingId: b.id }).ok);
    reassign = `<div class="field" style="margin-top:16px"><span>Reassign expert</span><div class="row"><select class="input" id="re-ex">${free.length ? free.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('') : '<option value="">No other qualified expert is free</option>'}</select><button class="btn" id="re-go" ${free.length ? '' : 'disabled'}>Reassign</button></div></div>`;
  }
  const money = role === 'partner'
    ? `<dt>Your space fee</dt><dd>${D.inr(sp.salonFee)}</dd><dt>Product charges</dt><dd>${D.inr(sp.products)}</dd>`
    : `<dt>Customer price</dt><dd>${D.inr(sp.price)} ${badge(b.payment)}</dd><dt>Salon fee</dt><dd>${D.inr(sp.salonFee)}</dd><dt>Products</dt><dd>${D.inr(sp.products)}</dd><dt>Expert payout</dt><dd>${D.inr(sp.expertPay)}${sp.travel ? ` + ${D.inr(sp.travel)} travel` : ''}</dd><dt>Arman share</dt><dd>${D.inr(sp.arman)}</dd>`;
  const nx = NEXT[b.status];
  const footer = canEdit ? `<button class="btn danger" data-st="cancelled">Cancel booking</button>${b.status === 'confirmed' ? '<button class="btn" data-st="noshow">Mark no-show</button>' : ''}${b.payment === 'pending' ? '<button class="btn" data-pay>Mark paid</button>' : ''}${nx ? `<button class="btn primary" data-st="${nx[0]}">${nx[1]}</button>` : ''}` : '';
  drawer({
    title: `${esc(sv.name)}`, sub: `${b.id} · ${fmtDate(b.date)} · ${D.hm12(b.start)}–${D.hm12(b.end)}`,
    body: `<div class="row" style="margin-bottom:16px">${badge(b.status)}<span class="muted">via ${esc(b.channel)}</span></div>
      <dl class="kv">${role === 'partner' ? '' : `<dt>Customer</dt><dd>${esc(b.customer.name)}<div class="cell-sub">${esc(b.customer.phone)}</div></dd>`}
      <dt>Salon</dt><dd>${esc(sal.name)}<div class="cell-sub">${esc(sal.area)}</div></dd><dt>Chair</dt><dd>${esc(ch?.name || b.chairId)}</dd>
      <dt>Expert</dt><dd>${esc(ex.name)}</dd><dt>Duration</dt><dd>${sv.duration} min + ${D.BUFFER} min cleanup</dd><dt>Products</dt><dd>${esc(products)}</dd>${money}</dl>${reassign}`,
    footer,
    onMount(el) {
      el.addEventListener('click', (e) => {
        const st = e.target.closest('[data-st]');
        if (st) {
          if (st.dataset.st === 'cancelled' && !confirm('Cancel this booking? The chair and expert become free again.')) return;
          D.setStatus(s, b.id, st.dataset.st); toast(`${b.id}: ${D.STATUS_LABEL[st.dataset.st]}`); closeDrawer(); return;
        }
        if (e.target.closest('[data-pay]')) { b.payment = 'paid'; D.save(); toast('Payment recorded'); closeDrawer(); return; }
        if (e.target.closest('#re-go')) {
          const nid = el.querySelector('#re-ex').value; if (!nid) return;
          b.expertId = nid; D.save(); toast(`Reassigned to ${D.expert(nid, s).name}`); closeDrawer();
        }
      });
    },
  });
}

/** Admin walk-in / phone booking straight onto a chair. Re-validates before writing. */
export function openNewBooking({ salonId, chairId, date, start }) {
  const s = D.db(); const sal = D.salon(salonId, s); const ch = sal.chairs.find((c) => c.id === chairId);
  const services = s.services.filter((v) => !v.wash || ch.wash);
  drawer({
    title: 'New booking', sub: `${esc(sal.name)} · ${esc(ch.name)} · ${fmtDate(date)} at ${D.hm12(start)}`,
    body: `<div class="stack">
      <label class="field"><span>Service</span><select class="input" id="nb-svc">${services.map((v) => `<option value="${v.id}">${esc(v.name)} — ${v.duration} min · ${D.inr(v.price)}</option>`).join('')}</select></label>
      <label class="field"><span>Expert</span><select class="input" id="nb-ex"></select></label>
      <div id="nb-msg" class="holdbar" hidden></div>
      <label class="field"><span>Customer name</span><input class="input" id="nb-name" autocomplete="off" placeholder="Full name"></label>
      <label class="field"><span>Mobile number</span><input class="input" id="nb-phone" inputmode="tel" placeholder="10-digit mobile"></label>
      <label class="field"><span>Payment</span><select class="input" id="nb-pay"><option value="pending">Collect at salon</option><option value="paid">Already paid (UPI / card)</option></select></label>
      <p class="muted" style="font-size:12.5px;margin:0">${ch.wash ? '' : 'This chair has no wash station, so wash services are hidden. '}The engine re-checks the chair and expert the moment you confirm.</p></div>`,
    footer: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="nb-go">Confirm booking</button>',
    onMount(el) {
      const $ = (q) => el.querySelector(q);
      const refresh = () => {
        const v = D.svc($('#nb-svc').value, s); const end = start + v.duration;
        const msg = $('#nb-msg'); const go = $('#nb-go');
        const busy = end > sal.close ? 'past closing time' : D.chairBusy(s, salonId, chairId, date, start, end);
        const ok = s.experts.filter((x) => x.status === 'active' && x.skills.includes(v.skill)).map((x) => ({ x, f: D.expertFree(s, x.id, salonId, date, start, end) })).filter((r) => r.f.ok);
        $('#nb-ex').innerHTML = ok.length ? ok.map((r) => `<option value="${r.x.id}">${esc(r.x.name)}${r.f.travel ? ' (travel ₹150)' : ''}</option>`).join('') : '<option value="">No qualified expert free</option>';
        const problem = busy ? `Chair is ${busy} for part of ${D.hm12(start)}–${D.hm12(end)}.` : !ok.length ? 'No qualified expert is free for this slot.' : '';
        msg.hidden = !problem; msg.textContent = problem; go.disabled = !!problem;
      };
      $('#nb-svc').addEventListener('change', refresh); refresh();
      $('#nb-go').addEventListener('click', () => {
        const name = $('#nb-name').value.trim(), phone = $('#nb-phone').value.replace(/\D/g, '');
        if (!name) { $('#nb-name').focus(); toast('Enter the customer name', 'bad'); return; }
        if (phone.length !== 10) { $('#nb-phone').focus(); toast('Enter a 10-digit mobile number', 'bad'); return; }
        const v = D.svc($('#nb-svc').value, s);
        const r = D.confirm(s, { serviceId: v.id, salonId, chairId, date, start, end: start + v.duration, expertId: $('#nb-ex').value }, { name, phone }, 'admin', $('#nb-pay').value);
        if (!r.ok) { toast(r.reason, 'bad'); refresh(); return; }
        toast(`Booked ${r.booking.id}`); closeDrawer();
      });
    },
  });
}

/** Partner blocks a chair for their own client or maintenance. */
export function openBlock({ salonId, chairId, date, start }) {
  const s = D.db(); const sal = D.salon(salonId, s); const ch = sal.chairs.find((c) => c.id === chairId);
  drawer({
    title: 'Block this chair', sub: `${esc(ch.name)} · ${fmtDate(date)} from ${D.hm12(start)}`,
    body: `<div class="stack"><label class="field"><span>For how long</span><select class="input" id="bk-len">${[30, 60, 90, 120, 180].map((m) => `<option value="${m}">${m >= 60 ? m / 60 + ' hr' : m + ' min'}</option>`).join('')}</select></label>
      <label class="field"><span>Reason</span><select class="input" id="bk-r"><option>Salon own client</option><option>Maintenance</option><option>Staff break</option><option>Closed</option></select></label>
      <p class="muted" style="font-size:12.5px;margin:0">Arman customers cannot book this chair while it is blocked.</p></div>`,
    footer: '<button class="btn" data-close>Cancel</button><button class="btn primary" id="bk-go">Block chair</button>',
    onMount(el) {
      el.querySelector('#bk-go').addEventListener('click', () => {
        const end = Math.min(sal.close, start + +el.querySelector('#bk-len').value);
        const busy = D.chairBusy(s, salonId, chairId, date, start, end - D.BUFFER);
        if (busy) { toast(`Chair is already ${busy} in that window`, 'bad'); return; }
        s.blocks.push({ id: 'blk' + Date.now(), salonId, chairId, date, start, end, reason: el.querySelector('#bk-r').value });
        D.save(); toast('Chair blocked'); closeDrawer();
      });
    },
  });
}

export function openBlockDetail(id) {
  const s = D.db(); const k = s.blocks.find((x) => x.id === id); if (!k) return;
  drawer({
    title: 'Blocked time', sub: `${fmtDate(k.date)} · ${D.hm12(k.start)}–${D.hm12(k.end)}`,
    body: `<dl class="kv"><dt>Salon</dt><dd>${esc(D.salon(k.salonId, s).name)}</dd><dt>Chair</dt><dd>${esc(k.chairId)}</dd><dt>Reason</dt><dd>${esc(k.reason)}</dd></dl>`,
    footer: '<button class="btn" data-close>Close</button><button class="btn danger" id="ub">Remove block</button>',
    onMount(el) { el.querySelector('#ub').addEventListener('click', () => { s.blocks = s.blocks.filter((x) => x.id !== id); D.save(); toast('Block removed'); closeDrawer(); }); },
  });
}

export function dateNav(date, act = 'date') {
  return `<div class="row"><button class="btn sm" data-act="${act}" data-d="${D.addDays(date, -1)}" aria-label="Previous day">‹</button>
    <input type="date" class="input" style="width:auto" value="${date}" data-change="${act}">
    <button class="btn sm" data-act="${act}" data-d="${D.addDays(date, 1)}" aria-label="Next day">›</button>
    ${date !== D.today() ? `<button class="btn sm" data-act="${act}" data-d="${D.today()}">Today</button>` : ''}</div>`;
}

export function bookingRows(s, list, { role = 'admin', cols = ['when', 'customer', 'service', 'salon', 'expert', 'price', 'status'] } = {}) {
  return list.map((b) => {
    const sv = D.svc(b.serviceId, s), sal = D.salon(b.salonId, s), ex = D.expert(b.expertId, s);
    const c = {
      when: `<td><b>${fmtDate(b.date, { day: 'numeric', month: 'short' })}</b><div class="cell-sub">${D.hm12(b.start)}</div></td>`,
      id: `<td>${b.id}</td>`,
      customer: `<td>${esc(b.customer.name)}<div class="cell-sub">${esc(b.customer.phone)}</div></td>`,
      service: `<td>${esc(sv.name)}<div class="cell-sub">${sv.duration} min</div></td>`,
      salon: `<td>${esc(sal.name)}<div class="cell-sub">${esc(D.chairOf(b, s)?.name || '')}</div></td>`,
      chair: `<td>${esc(D.chairOf(b, s)?.name || '')}</td>`,
      expert: `<td>${esc(ex?.name || '')}</td>`,
      price: `<td class="r num">${D.inr(b.split.price)}<div class="cell-sub">${b.payment}</div></td>`,
      fee: `<td class="r num">${D.inr(b.split.salonFee + b.split.products)}</td>`,
      status: `<td>${badge(b.status)}</td>`,
    };
    return `<tr data-act="booking" data-id="${b.id}" style="cursor:pointer">${cols.map((k) => c[k]).join('')}</tr>`;
  }).join('');
}
export const HEAD = { when: 'When', id: 'Booking', customer: 'Customer', service: 'Service', salon: 'Salon', chair: 'Chair', expert: 'Expert', price: '<span style="display:block;text-align:right">Price</span>', fee: '<span style="display:block;text-align:right">Your earning</span>', status: 'Status' };
export { icon };
