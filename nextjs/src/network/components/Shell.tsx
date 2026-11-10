'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { REMOTE } from '../lib/data';
import { currentProfile, Profile, Role, signOut } from '../lib/supabase';
import { useTheme } from '../lib/hooks';
import { Icon, initials, Loading, Logo } from './ui';

export interface NavItem { href: string; label: string; icon: string; tag?: string; count?: number }
interface ShellCtx { userName: string; roleLabel: string; bell?: { href: string; count: number } }
const Ctx = createContext<ShellCtx>({ userName: 'Arman Khan', roleLabel: 'Super Admin' });

/** Blocks a portal until the signed-in user has the right role (Supabase mode). Demo mode lets everyone in. */
export function useGuard(role: Role): { ok: boolean; profile: Profile | null } {
  const router = useRouter();
  const [state, setState] = useState<{ ok: boolean; profile: Profile | null } | null>(null);
  const go = useRef(router.replace); go.current = router.replace;
  useEffect(() => {
    if (!REMOTE) { setState({ ok: true, profile: null }); return; }
    const p = currentProfile();
    if (!p) { go.current(`/network/login?next=${encodeURIComponent(window.location.pathname)}`); return; }
    setState({ ok: p.role === role || p.role === 'admin', profile: p });
  }, [role]);
  return state ?? { ok: false, profile: null };
}

export function Shell({ portal, sub, crest, nav, switcher, promo, userName, roleLabel, bell, role, children }: {
  portal: string; sub: string; crest: string; nav: NavItem[]; switcher?: ReactNode; promo?: ReactNode;
  userName: string; roleLabel: string; bell?: { href: string; count: number }; role: Role; children: ReactNode;
}) {
  useTheme();
  const path = usePathname() || '';
  const router = useRouter();
  const guard = useGuard(role);
  const active = [...nav].sort((a, b) => b.href.length - a.href.length).find((n) => path === n.href || path.startsWith(n.href + '/'))?.href ?? nav[0].href;
  const name = guard.profile?.full_name || userName;

  if (!guard.ok) {
    return <div className="dark-page"><div className="dark-in">{REMOTE && guard.profile ? <div className="login-box"><h1>No access</h1><p className="muted">This account is set up for the {guard.profile.role} portal.</p><Link className="btn gold" href="/network/login">Switch account</Link></div> : <Loading text="Checking access…" />}</div></div>;
  }

  return <Ctx.Provider value={{ userName: name, roleLabel, bell }}>
    <div className="pn-shell">
      <aside className="rail">
        <Link className="brand" href="/network" aria-label="Arman Partner Network home"><Logo height={56} /></Link>
        <div className="role"><span className="crest"><Icon name={crest} /></span><div><b>{portal}</b><small>{sub}</small></div></div>
        {switcher}
        <nav className="nav" aria-label={portal}>
          {nav.map((n) => <Link key={n.href} href={n.href} aria-current={n.href === active ? 'page' : undefined}>
            <Icon name={n.icon} /><span>{n.label}</span>
            {n.tag ? <span className="tag">{n.tag}</span> : n.count ? <span className="count">{n.count}</span> : <Icon name="chevron" className="chev" />}
          </Link>)}
        </nav>
        {promo}
        <div className="rail-foot">
          <Link href="/network">Switch portal</Link>
          <Link href="/">Arman website</Link>
          {REMOTE && <button onClick={async () => { await signOut(); router.replace('/network/login'); }}>Sign out</button>}
        </div>
      </aside>
      <div style={{ minWidth: 0 }}>
        <div className="mobile-bar">
          <Link href="/network" aria-label="Home"><Logo height={30} /></Link>
          <select aria-label="Go to" value={active} onChange={(e) => router.push(e.target.value)}>
            {nav.map((n) => <option key={n.href} value={n.href}>{n.label}</option>)}
          </select>
        </div>
        <main className="main">
          {switcher && <div className="mobile-only" style={{ marginBottom: 14 }}>{switcher}</div>}
          {children}
        </main>
      </div>
    </div>
  </Ctx.Provider>;
}

function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }

export function PageHead({ title, sub, tools, hello }: { title: string; sub?: ReactNode; tools?: ReactNode; hello?: boolean }) {
  const c = useContext(Ctx);
  const [hi, setHi] = useState('');
  useEffect(() => { if (hello) setHi(`${greeting()}, ${c.userName.split(' ')[0]}`); }, [hello, c.userName]);
  return <div className="topbar">
    <div>{hello && <div className="hello">{hi || ' '}</div>}<h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>
    <div className="top-tools">
      {tools}
      {c.bell && <Link className="bell" href={c.bell.href} aria-label={`${c.bell.count} items need attention`}><Icon name="bell" />{c.bell.count > 0 && <i>{c.bell.count}</i>}</Link>}
      <div className="user"><span className="avatar">{initials(c.userName)}</span><div className="who"><b>{c.userName}</b><small>{c.roleLabel}</small></div></div>
    </div>
  </div>;
}
