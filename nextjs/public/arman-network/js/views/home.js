import * as D from '../data.js';
import { icon, toast } from '../ui.js';

const PORTALS = [
  { href: '#/book', icon: 'calendar', name: 'Book an appointment', who: 'For customers', text: 'Pick a service, area and time. The platform finds a free chair at a partner salon and the right Arman expert.' },
  { href: '#/admin/dashboard', icon: 'crown', name: 'Super Admin', who: 'For Arman', text: 'Bookings, live seat schedule, partner salons, experts, pricing, settlements and reports.' },
  { href: '#/partner/dashboard', icon: 'store', name: 'Salon Partner', who: 'For partner salons', text: 'Chairs, wash stations, open hours, product rates, today’s Arman bookings and payouts.' },
  { href: '#/expert/today', icon: 'scissors', name: 'Expert app', who: 'For Arman experts', text: 'Today’s jobs, check-in at the salon, products used, job completion and earnings.' },
];

export default function home() {
  const s = D.db();
  const t = D.today();
  const todayCount = s.bookings.filter((b) => b.date === t && b.status !== 'cancelled').length;
  const salons = s.salons.filter((x) => x.status === 'approved').length;
  const chairs = s.salons.filter((x) => x.status === 'approved').reduce((n, x) => n + x.chairs.filter((c) => c.active).length, 0);
  return {
    title: 'Home',
    html: `<div class="home"><div class="home-in">
      <div class="home-top">
        <a class="brand" href="/armanhairstudios"><img src="/arman-network/assets/arman-logo.png" alt="Arman Hair Studio" style="height:46px" onerror="this.nextElementSibling.hidden=false;this.remove()"><span class="brand-text" style="font-size:22px" hidden>ARMAN<small>HAIR STUDIO</small></span></a>
        <a class="back" href="/armanhairstudios">Back to armanhairstudios website</a>
      </div>
      <section class="home-hero">
        <div>
          <h1>Your brand and experts, in partner salons across Bhopal.</h1>
          <p>Arman owns the clients, pricing and quality. Partner salons rent out chairs and facilities. This platform books, allocates, serves and settles every appointment. Right now: ${salons} partner salons, ${chairs} live chairs and ${todayCount} bookings today.</p>
          <a class="btn gold lg" href="#/book">Book an appointment</a>
        </div>
        <ol class="flow" aria-label="How one booking flows">
          <li><b>Customer books</b><span>Service, area, date and time on the Arman site</span></li>
          <li><b>Platform allocates</b><span>Free chair with the right facilities + a qualified, free expert, held for 5 minutes</span></li>
          <li><b>Expert serves</b><span>Checks in at the partner salon, logs products used, completes the job</span></li>
          <li><b>Payment is recorded</b><span>Customer pays Arman; invoice is issued</span></li>
          <li><b>Settlement</b><span>Salon gets space fee + products, expert gets payout + travel, Arman keeps the rest</span></li>
        </ol>
      </section>
      <nav class="portals" aria-label="Portals">
        ${PORTALS.map((p) => `<a class="portal" href="${p.href}">${icon(p.icon)}<div><h3>${p.name}</h3><div style="color:var(--gold);font-size:12.5px">${p.who}</div></div><p>${p.text}</p><span class="go">Open</span></a>`).join('')}
      </nav>
      <p class="home-note">Phase 1 preview: screens run on demo data stored in this browser, so you can book in one portal and see it in the others. Sign-in, payments and the database come in Phase 2. <button data-act="reset">Reset demo data</button></p>
    </div></div>`,
    actions: { reset() { if (confirm('Reset all demo bookings and settings in this browser?')) { D.resetDemo(); toast('Demo data reset'); } } },
  };
}
