/* POST /api/register { username, email, password, owner, business, phone, city, country, plan }
   Creates a confirmed merchant account with an empty workspace and signs it in. */
import { admin, json, fail, readJson, passwordGrant, toAccount, usernameTaken, emailTaken, legacyStore, USERNAME_RE, EMAIL_RE } from '../lib/core.mjs';

export default async (req) => {
  if (req.method !== 'POST') return fail('method_not_allowed', 405);
  const b = await readJson(req);
  const username = String(b.username || '').trim().toLowerCase();
  const email = String(b.email || '').trim();
  if (!USERNAME_RE.test(username)) return fail('username_invalid');
  if (!EMAIL_RE.test(email)) return fail('email_invalid');
  if (String(b.password || '').length < 6) return fail('password_too_short');
  if (!String(b.owner || '').trim() || !String(b.business || '').trim()) return fail('missing_fields');
  if (await usernameTaken(username)) return fail('username_taken', 409);
  if (await emailTaken(email)) return fail('email_taken', 409);

  const { data: created, error } = await admin.auth.admin.createUser({ email, password: b.password, email_confirm: true });
  if (error) return fail(/already/i.test(error.message) ? 'email_taken' : 'register_failed', 409);
  const id = created.user.id;

  const row = {
    id, role: 'merchant', status: 'active', username, email,
    owner: String(b.owner).trim(), business: String(b.business).trim(), phone: String(b.phone || '').trim(),
    city: String(b.city || ''), country: String(b.country || ''), plan: b.plan === 'pro' ? 'pro' : 'free',
    last_login: new Date().toISOString(),
  };
  const { data: inserted, error: e2 } = await admin.from('accounts').insert(row).select('*').single();
  if (e2) { await admin.auth.admin.deleteUser(id); return fail(/username/.test(e2.message) ? 'username_taken' : 'register_failed', 409); }

  const account = toAccount(inserted);
  const state = legacyStore().emptyState(account);
  await admin.from('merchant_data').insert({ account_id: id, state });

  const session = await passwordGrant(email, b.password);
  return json({ session, account });
};

export const config = { path: '/api/register' };
