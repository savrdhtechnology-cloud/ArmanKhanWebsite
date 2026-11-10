import * as D from './data.js';
import { openBooking, openBlockDetail } from './shared.js';
import home from './views/home.js';
import customer from './views/customer.js';
import admin from './views/admin.js';
import partner from './views/partner.js';
import expert from './views/expert.js';

const routes = { '': home, book: customer, admin, partner, expert };
const app = document.getElementById('app');
let current = null;
let lastKey = '';

export function parse() {
  const [path, qs] = (location.hash.replace(/^#\/?/, '') || '').split('?');
  const parts = path.split('/').filter(Boolean);
  return { parts, q: new URLSearchParams(qs || '') };
}

function render() {
  const { parts, q } = parse();
  const view = routes[parts[0] || ''] || home;
  const key = location.hash;
  const sched = app.querySelector('[data-sched]');
  const keep = key === lastKey ? { left: sched?.scrollLeft || 0, y: window.scrollY } : null;
  current = view(parts.slice(1), q);
  app.innerHTML = current.html;
  document.title = (current.title ? current.title + ' — ' : '') + 'Arman Partner Network';
  current.mount?.(app);
  if (keep) { const s2 = app.querySelector('[data-sched]'); if (s2) s2.scrollLeft = keep.left; window.scrollTo(0, keep.y); }
  else { window.scrollTo(0, 0); const sc = app.querySelector('[data-sched]'); if (sc) sc.scrollLeft = +sc.dataset.scroll || 0; }
  lastKey = key;
}

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || !app.contains(el)) return;
  const fn = current?.actions?.[el.dataset.act];
  if (fn) { fn(el, e); return; }
  if (el.dataset.act === 'booking') openBooking(el.dataset.id, current?.role || 'admin');
  if (el.dataset.act === 'block') openBlockDetail(el.dataset.id);
});
app.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('[data-nav]')) { location.hash = el.value; return; }
  const name = el.dataset.change; if (name) current?.change?.[name]?.(el, e);
});
app.addEventListener('input', (e) => { const name = e.target.dataset.input; if (name) current?.input?.[name]?.(e.target, e); });

window.addEventListener('hashchange', render);
D.onChange(() => render());
// expire 5-minute holds on screen without user action
setInterval(() => { const s = D.db(); const n = s.holds.length; s.holds = s.holds.filter((h) => h.expires > Date.now()); if (s.holds.length !== n) D.save(); }, 15000);
// other tabs (e.g. customer portal in one tab, admin in another) stay in sync
window.addEventListener('storage', (e) => { if (e.key === 'arman-network-v1') D.reload(); });

render();
