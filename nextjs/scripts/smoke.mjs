// Opens every route on a running `next start` server in Chromium, fails on page errors,
// and saves a screenshot per route (uploaded as a CI artifact).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SMOKE_URL || 'http://localhost:3000';
const routes = [
  '/', '/about', '/services', '/gallery', '/reviews', '/contact', '/login', '/register', '/app',
  '/network', '/network/book', '/network/book/find', '/network/login',
  '/network/admin', '/network/admin/live', '/network/admin/bookings', '/network/admin/salons', '/network/admin/experts',
  '/network/admin/customers', '/network/admin/services', '/network/admin/finance', '/network/admin/reports',
  '/network/admin/appearance', '/network/admin/settings',
  '/network/partner', '/network/partner/availability', '/network/partner/facilities', '/network/partner/products', '/network/partner/payouts',
  '/network/expert', '/network/expert/earnings',
];

mkdirSync('smoke', { recursive: true });
const browser = await chromium.launch();
let failed = 0;
for (const [tag, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport });
  for (const r of routes) {
    const errors = [];
    const onErr = (e) => errors.push(String(e));
    page.on('pageerror', onErr);
    const res = await page.goto(BASE + r, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    page.off('pageerror', onErr);
    const name = `${tag}${r.replace(/\//g, '_') || '_home'}`;
    await page.screenshot({ path: `smoke/${name}.png`, fullPage: tag === 'desktop' });
    const bad = !res || res.status() >= 400 || errors.length > 0;
    if (bad) failed++;
    console.log(`${bad ? 'FAIL' : 'ok  '} ${tag} ${r} ${res?.status()}${wide ? ' (horizontal scroll)' : ''}${errors.length ? ' ' + errors.join(' | ') : ''}`);
  }
  await page.close();
}
await browser.close();
if (failed) { console.error(`${failed} route(s) failed`); process.exit(1); }
