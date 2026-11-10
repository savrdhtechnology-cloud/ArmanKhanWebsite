'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import * as D from '../lib/data';
import { useStore } from '../lib/hooks';
import { Shell } from '../components/Shell';
import { Icon } from '../components/ui';

const B = '/network/admin';

export function AdminShell({ children }: { children: ReactNode }) {
  const s = useStore();
  const pending = s?.salons.filter((x) => x.status === 'pending').length ?? 0;
  const nav = [
    { href: B, label: 'Overview', icon: 'home' },
    { href: `${B}/live`, label: 'Live Booking', icon: 'grid' },
    { href: `${B}/bookings`, label: 'Bookings', icon: 'calendar' },
    { href: `${B}/salons`, label: 'Salon Partners', icon: 'store', count: pending },
    { href: `${B}/experts`, label: 'Experts', icon: 'scissors' },
    { href: `${B}/customers`, label: 'Customers', icon: 'users' },
    { href: `${B}/services`, label: 'Services & Pricing', icon: 'tag' },
    { href: `${B}/finance`, label: 'Finance & Settlements', icon: 'coins' },
    { href: `${B}/reports`, label: 'Analytics & Reports', icon: 'chart' },
    { href: `${B}/appearance`, label: 'Appearance Studio', icon: 'palette', tag: 'New' },
    { href: `${B}/settings`, label: 'Settings', icon: 'settings' },
  ];
  const today = s ? s.bookings.filter((b) => b.date === D.today() && b.status === 'confirmed').length : 0;
  return <Shell portal="Super Admin" sub="Network Control Center" crest="crown" role="admin" nav={nav} userName="Arman Khan" roleLabel="Super Admin"
    bell={{ href: `${B}/salons`, count: pending }}
    promo={<div className="promo"><b>Expand Partner Network</b><p>Onboard new salons and grow your city coverage.{today ? ` ${today} bookings waiting to start today.` : ''}</p><Link className="btn gold sm" href={`${B}/salons?new=1`}><Icon name="plus" />Onboard Salon</Link></div>}>
    {children}
  </Shell>;
}
