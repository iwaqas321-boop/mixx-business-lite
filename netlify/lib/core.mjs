/* =====================================================================
   Shared server helpers for the Netlify Functions.
   Uses the Supabase secret key, so this code must only ever run on the
   server — never import it from site/.
   ===================================================================== */
import { createClient } from '@supabase/supabase-js';
import loadLegacyStore from './legacy-store.mjs';

const URL = process.env.SUPABASE_URL;
const PUBLISHABLE = process.env.SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;

export const admin = createClient(URL, SECRET, { auth: { persistSession: false, autoRefreshToken: false } });

/* ---------- responses ---------- */
export const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
export const fail = (code, status = 400) => json({ error: code }, status);
export async function readJson(req) { try { return await req.json(); } catch (e) { return {}; } }

/* ---------- accounts ---------- */
const norm = s => String(s || '').trim().toLowerCase();
export const USERNAME_RE = /^[a-z0-9._-]{3,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* DB row -> the account shape the prototype's front end expects */
export function toAccount(r) {
  if (!r) return null;
  return { id: r.id, role: r.role, status: r.status, username: r.username, email: r.email, owner: r.owner, business: r.business,
    phone: r.phone, city: r.city, country: r.country, plan: r.plan, mdr: r.mdr || {}, gatewayLocks: r.gateway_locks || {},
    createdAt: r.created_at, lastLogin: r.last_login };
}

export async function findAccount(identifier) {
  const id = norm(identifier); if (!id) return null;
  const col = id.includes('@') ? 'email' : 'username';
  const q = admin.from('accounts').select('*');
  const { data } = await (col === 'email' ? q.ilike('email', id.replace(/[%_\\]/g, '\\$&')) : q.eq('username', id)).maybeSingle();
  return data || null;
}

export async function usernameTaken(username) {
  const { data } = await admin.from('accounts').select('id').eq('username', norm(username)).maybeSingle();
  return !!data;
}
export async function emailTaken(email, exceptId) {
  const { data } = await admin.from('accounts').select('id').ilike('email', norm(email).replace(/[%_\\]/g, '\\$&'));
  return (data || []).some(r => r.id !== exceptId);
}

/* Supabase password sign-in. Returns the session, or null on wrong password. */
export async function passwordGrant(email, password) {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: PUBLISHABLE, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const s = await res.json();
  return { access_token: s.access_token, refresh_token: s.refresh_token };
}

/* The signed-in caller (from the Authorization header) and their account row */
export async function getCaller(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data || !data.user) return null;
  const { data: row } = await admin.from('accounts').select('*').eq('id', data.user.id).maybeSingle();
  if (!row || row.status !== 'active') return null;
  return { user: data.user, account: row };
}

/* ---------- merchant workspace ---------- */
let legacy = null;
export function legacyStore() { return legacy || (legacy = loadLegacyStore()); }

export async function getPlatform() {
  const { data } = await admin.from('platform').select('settings').eq('id', 1).maybeSingle();
  return data ? data.settings : (await legacyStore().getPlatform());
}

/* Read-modify-write a merchant's workspace with the version check, retrying
   if the merchant's own browser saved in between. */
export async function updateState(accountId, mutate) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: row } = await admin.from('merchant_data').select('state, version').eq('account_id', accountId).maybeSingle();
    if (!row) return null;
    const out = mutate(row.state);
    if (out === false || (out && out.error)) return out;
    const { data: saved } = await admin.from('merchant_data')
      .update({ state: row.state, version: row.version + 1, updated_at: new Date().toISOString() })
      .eq('account_id', accountId).eq('version', row.version).select('version');
    if (saved && saved.length) return out;
  }
  throw new Error('busy');
}

/* ---------- demo data ---------- */
/* (Re)creates the prototype's demo merchants with their sample history.
   Real merchants and the admin account are left alone. */
export async function seedDemoMerchants() {
  const db = await legacyStore().exportAll();
  const out = [];
  for (const a of db.accounts.filter(x => x.role === 'merchant')) {
    const row = { role: 'merchant', status: a.status, username: a.username, email: a.email, owner: a.owner, business: a.business,
      phone: a.phone || '', city: a.city || '', country: a.country || '', plan: a.plan, mdr: a.mdr || {}, gateway_locks: a.gatewayLocks || {},
      created_at: a.createdAt, last_login: a.lastLogin };
    let existing = await findAccount(a.username);
    let id;
    if (existing) {
      id = existing.id;
      await admin.auth.admin.updateUserById(id, { password: 'demo123' });
      await admin.from('accounts').update(row).eq('id', id);
    } else {
      const { data, error } = await admin.auth.admin.createUser({ email: a.email, password: 'demo123', email_confirm: true });
      if (error) throw error;
      id = data.user.id;
      const { error: e2 } = await admin.from('accounts').insert({ id, ...row });
      if (e2) throw e2;
    }
    await admin.from('merchant_data').upsert({ account_id: id, state: db.data[a.id], version: Math.floor(Date.now() / 1000), updated_at: new Date().toISOString() });
    out.push(a.username);
  }
  await admin.from('platform').upsert({ id: 1, settings: db.platform, updated_at: new Date().toISOString() });
  return out;
}

/* Creates the admin account if it doesn't exist yet. */
export async function ensureAdmin(email, password) {
  const existing = await findAccount('admin');
  if (existing) return { created: false, id: existing.id };
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const id = data.user.id;
  const { error: e2 } = await admin.from('accounts').insert({ id, role: 'admin', username: 'admin', email, owner: 'Platform Admin',
    business: 'Mixx Business Lite', city: 'Dakar, Sénégal', country: 'SN' });
  if (e2) throw e2;
  return { created: true, id };
}
