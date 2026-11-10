// Minimal Supabase client over fetch (PostgREST + GoTrue). No SDK dependency.

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const REMOTE = Boolean(URL_ && KEY);

export type Role = 'admin' | 'partner' | 'expert';
export interface Profile { role: Role; salon_id: string | null; expert_id: string | null; full_name: string; email: string }
interface Session { access_token: string; refresh_token: string; expires_at: number; user: { id: string; email: string }; profile: Profile | null }

const SKEY = 'arman-network-auth';
let session: Session | null = null;
let loaded = false;

function readSession() {
  if (loaded) return session;
  loaded = true;
  try { const raw = localStorage.getItem(SKEY); if (raw) session = JSON.parse(raw) as Session; } catch { /* ignore */ }
  return session;
}
function writeSession(s: Session | null) {
  session = s;
  try { if (s) localStorage.setItem(SKEY, JSON.stringify(s)); else localStorage.removeItem(SKEY); } catch { /* ignore */ }
}

export class ApiError extends Error {}

async function parseError(res: Response) {
  try {
    const j = await res.json();
    return String(j.message || j.msg || j.error_description || j.error || res.statusText);
  } catch { return res.statusText || 'Request failed'; }
}

async function accessToken(): Promise<string> {
  const s = readSession();
  if (!s) return KEY;
  if (s.expires_at * 1000 > Date.now() + 60_000) return s.access_token;
  const res = await fetch(`${URL_}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }),
  });
  if (!res.ok) { writeSession(null); return KEY; }
  const j = await res.json();
  writeSession({ ...s, access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at ?? Math.floor(Date.now() / 1000) + j.expires_in });
  return j.access_token;
}

export async function rest<T = unknown>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    method: init.method || 'GET',
    headers: {
      apikey: KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json',
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(await parseError(res));
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const rpc = <T = unknown>(fn: string, args: Record<string, unknown>) => rest<T>(`rpc/${fn}`, { method: 'POST', body: args });

export async function signIn(email: string, password: string): Promise<Profile> {
  const res = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new ApiError(res.status === 400 ? 'Wrong email or password' : await parseError(res));
  const j = await res.json();
  writeSession({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at ?? Math.floor(Date.now() / 1000) + j.expires_in, user: { id: j.user.id, email: j.user.email }, profile: null });
  const rows = await rest<Omit<Profile, 'email'>[]>(`profiles?select=role,salon_id,expert_id,full_name&user_id=eq.${j.user.id}`);
  if (!rows.length) { writeSession(null); throw new ApiError('This account has no portal access yet. Ask the Arman admin to assign a role.'); }
  const profile: Profile = { ...rows[0], email: j.user.email };
  writeSession({ ...session!, profile });
  return profile;
}

export async function signOut() {
  const s = readSession();
  if (s) { try { await fetch(`${URL_}/auth/v1/logout`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${s.access_token}` } }); } catch { /* ignore */ } }
  writeSession(null);
}

export const currentProfile = (): Profile | null => readSession()?.profile ?? null;
