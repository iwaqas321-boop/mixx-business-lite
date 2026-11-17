/* POST /api/login { identifier, password } -> { session, account }
   Accepts a username or an e-mail, like the prototype. */
import { admin, json, fail, readJson, findAccount, passwordGrant, toAccount } from '../lib/core.mjs';

export default async (req) => {
  if (req.method !== 'POST') return fail('method_not_allowed', 405);
  const { identifier, password } = await readJson(req);
  if (!identifier || !password) return fail('invalid_credentials', 401);

  const row = await findAccount(identifier);
  if (!row) return fail('invalid_credentials', 401);
  const { data: u } = await admin.auth.admin.getUserById(row.id);
  const session = u && u.user ? await passwordGrant(u.user.email, password) : null;
  if (!session) return fail('invalid_credentials', 401);
  if (row.status !== 'active') return fail('account_disabled', 403);

  const lastLogin = new Date().toISOString();
  await admin.from('accounts').update({ last_login: lastLogin }).eq('id', row.id);
  return json({ session, account: toAccount({ ...row, last_login: lastLogin }) });
};

export const config = { path: '/api/login' };
