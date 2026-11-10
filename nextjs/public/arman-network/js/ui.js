import { inr, STATUS_LABEL } from './data.js';

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const P = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  store: '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16V7"/><path d="M16 14h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  chair: '<path d="M6 19v2M18 19v2M5 11V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5"/><path d="M3 11h18v5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  crown: '<path d="M2 8l4 10h12l4-10-6 4-4-7-4 7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  home: '<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  log: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
};
export const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

const TONE = { confirmed: 'info', checkedin: 'gold', inservice: 'gold', completed: 'good', cancelled: 'bad', noshow: 'bad', paid: 'good', pending: 'warn', refunded: 'bad', approved: 'good', active: 'good', suspended: 'bad', leave: 'warn' };
export const badge = (s, label) => `<span class="badge ${TONE[s] || ''}">${esc(label || STATUS_LABEL[s] || s[0].toUpperCase() + s.slice(1))}</span>`;

// ---------- Toast ----------
export function toast(msg, tone = '') {
  let box = document.querySelector('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
  const t = document.createElement('div'); t.className = 'toast ' + tone; t.textContent = msg; box.append(t);
  setTimeout(() => t.remove(), 3200);
}

// ---------- Drawer ----------
export function drawer({ title, sub = '', body, footer = '', onMount }) {
  closeDrawer();
  const wrap = document.createElement('div'); wrap.id = 'drawer-root';
  wrap.innerHTML = `<div class="scrim" data-close></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-title">
      <header><div><h2 id="dr-title" class="h2">${title}</h2>${sub ? `<div class="muted" style="font-size:13px;margin-top:2px">${sub}</div>` : ''}</div>
      <button class="icon-btn" data-close aria-label="Close">${icon('x')}</button></header>
      <div class="body">${body}</div>${footer ? `<footer>${footer}</footer>` : ''}</aside>`;
  document.body.append(wrap);
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDrawer(); });
  const key = (e) => { if (e.key === 'Escape') closeDrawer(); };
  document.addEventListener('keydown', key); wrap._key = key;
  (wrap.querySelector('.body input, .body select, footer .btn') || wrap.querySelector('[data-close]')).focus();
  onMount?.(wrap.querySelector('.drawer'));
  return wrap.querySelector('.drawer');
}
export function closeDrawer() { const d = document.getElementById('drawer-root'); if (d) { document.removeEventListener('keydown', d._key); d.remove(); } }

// ---------- Charts ----------
/** Single-series bar chart with a per-bar hover tooltip. data: [{label, value, tip}] */
export function barChart(data, { height = 190, color = 'var(--s1)', fmt = (v) => v } = {}) {
  const W = 640, H = height, pl = 34, pb = 22, pt = 8;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = niceStep(max); const top = Math.ceil(max / step) * step;
  const bw = (W - pl) / data.length; const barW = Math.max(4, Math.min(28, bw - 6));
  const y = (v) => pt + (H - pt - pb) * (1 - v / top);
  let ticks = ''; for (let v = 0; v <= top; v += step) ticks += `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-2)"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const every = Math.ceil(data.length / 8);
  const bars = data.map((d, i) => {
    const x = pl + i * bw + (bw - barW) / 2, yy = y(d.value), hh = H - pb - yy;
    const r = Math.min(4, barW / 2, hh);
    const path = hh > 0 ? `M${x},${H - pb} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + barW - r} Q${x + barW},${yy} ${x + barW},${yy + r} V${H - pb} Z` : '';
    return `<g data-i="${i}"><rect x="${pl + i * bw}" y="${pt}" width="${bw}" height="${H - pt - pb}" fill="transparent"/>${path ? `<path d="${path}" fill="${color}"/>` : ''}
      ${i % every === 0 ? `<text x="${x + barW / 2}" y="${H - 6}" text-anchor="middle">${esc(d.label)}</text>` : ''}</g>`;
  }).join('');
  const id = 'c' + Math.random().toString(36).slice(2, 8);
  setTimeout(() => {
    const el = document.getElementById(id); if (!el) return;
    const tip = el.querySelector('.tip');
    el.addEventListener('pointermove', (e) => {
      const g = e.target.closest('g[data-i]'); if (!g) { tip.hidden = true; return; }
      const d = data[+g.dataset.i]; const box = el.getBoundingClientRect();
      tip.hidden = false; tip.innerHTML = `<b>${esc(d.tip || d.label)}</b><br>${esc(fmt(d.value))}`;
      tip.style.left = (e.clientX - box.left) + 'px'; tip.style.top = (e.clientY - box.top) + 'px';
    });
    el.addEventListener('pointerleave', () => { tip.hidden = true; });
  });
  return `<div class="chart" id="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart">${ticks}${bars}</svg><div class="tip" hidden></div></div>`;
}
function niceStep(max) { const raw = max / 4; const p = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw); }

// fixed entity → colour mapping (validated palette, never re-ordered)
export const SPLIT_KEYS = [
  { k: 'salonFee', label: 'Salon space fee', c: 'var(--s1)' },
  { k: 'arman', label: 'Arman contribution', c: 'var(--s2)' },
  { k: 'expertPay', label: 'Expert payout', c: 'var(--s3)' },
  { k: 'travel', label: 'Travel & operations', c: 'var(--s4)' },
  { k: 'products', label: 'Salon product charges', c: 'var(--s5)' },
];
export function splitBar(t, total = t.revenue ?? t.price) {
  const parts = SPLIT_KEYS.map((s) => ({ ...s, v: Math.max(0, t[s.k] || 0) }));
  const sum = parts.reduce((a, p) => a + p.v, 0) || 1;
  return `<div class="splitbar" role="img" aria-label="Revenue split">${parts.map((p) => `<div style="flex:${p.v};background:${p.c}" title="${p.label}: ${inr(p.v)}"></div>`).join('')}</div>
  <div class="split-legend">${parts.map((p) => `<div class="li"><i style="background:${p.c}"></i><span>${p.label}</span><b class="num">${inr(p.v)}</b><span class="pct num">${Math.round((p.v / sum) * 100)}%</span></div>`).join('')}
  <div class="li" style="border-top:1px solid var(--line);padding-top:8px"><i></i><b>Customer paid</b><b class="num">${inr(total)}</b><span class="pct"></span></div></div>`;
}

// ---------- App shell for operator portals ----------
export function shell({ portal, portalIcon, nav, active, title, sub = '', actions = '', content, switcher = '' }) {
  const links = nav.map((n) => `<a href="${n.href}" ${n.id === active ? 'aria-current="page"' : ''}>${icon(n.icon)}<span>${n.label}</span></a>`).join('');
  const opts = nav.map((n) => `<option value="${n.href}" ${n.id === active ? 'selected' : ''}>${n.label}</option>`).join('');
  return `<div class="shell">
    <aside class="rail">
      <a class="brand" href="#/"><img src="/arman-network/assets/arman-logo.png" alt="Arman Hair Studio" onerror="this.nextElementSibling.hidden=false;this.remove()"><span class="brand-text" hidden>ARMAN<small>HAIR STUDIO</small></span></a>
      <div class="portal-name">${icon(portalIcon)}<span>${portal}</span></div>
      ${switcher}
      <nav class="nav" aria-label="${portal}">${links}</nav>
      <div class="rail-foot"><a href="#/">Switch portal</a><a href="/armanhairstudios">Back to website</a></div>
    </aside>
    <div>
      <div class="mobile-bar"><a class="brand" href="#/"><img src="/arman-network/assets/arman-logo.png" alt="Arman Hair Studio" onerror="this.nextElementSibling.hidden=false;this.remove()"><span class="brand-text" style="font-size:16px" hidden>ARMAN</span></a><select aria-label="Go to" data-nav>${opts}</select></div>
      <main class="main" id="main">
        <div class="topbar"><div><h1 class="title">${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="row wrap">${switcher ? `<div class="mobile-only">${switcher}</div>` : ''}${actions}</div></div>
        ${content}
      </main>
    </div></div>`;
}

export const fmtDate = (iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', opts);
export const empty = (title, text, action = '') => `<div class="empty"><b>${esc(title)}</b>${esc(text)}${action ? `<div style="margin-top:12px">${action}</div>` : ''}</div>`;
