/* POST /api/account { action, ... }  (Authorization: Bearer <user access token>)
   Account operations that need the secret key: passwords, e-mail changes,
   deleting accounts, and the admin's backup / restore / demo reset. */
import { admin, json, fail, readJson, getCaller, passwordGrant, emailTaken, findAccount, toAccount, seedDemoMerchants, EMAIL_RE } from '../lib/core.mjs';

const PROFILE = ['owner', 'business', 'phone', 'city', 'country', 'plan', 'status'];

export default async (req) => {
  if (req.method !== 'POST') return fail('method_not_allowed', 405);
  const caller = await getCaller(req);
  if (!caller) return fail('not_signed_in', 401);
  const me = caller.account, isAdmin = me.role === 'admin';
  const b = await readJson(req);

  switch (b.action) {
    case 'changePassword': {
      if (String(b.next || '').length < 6) return fail('password_too_short');
      if (!(await passwordGrant(caller.user.email, b.current || ''))) return fail('wrong_password', 403);
      await admin.auth.admin.updateUserById(me.id, { password: b.next });
      return json({ ok: true });
    }
    case 'updateEmail': {
      if (b.id !== me.id && !isAdmin) return fail('forbidden', 403);
      const email = String(b.email || '').trim();
      if (!EMAIL_RE.test(email)) return fail('email_invalid');
      if (await emailTaken(email, b.id)) return fail('email_taken', 409);
      const { error } = await admin.auth.admin.updateUserById(b.id, { email, email_confirm: true });
      if (error) return fail(/already/i.test(error.message) ? 'email_taken' : 'update_failed', 409);
      const { data } = await admin.from('accounts').update({ email }).eq('id', b.id).select('*').single();
      return json({ account: toAccount(data) });
    }
  }

  if (!isAdmin) return fail('forbidden', 403);
  switch (b.action) {
    case 'setPassword': {
      if (String(b.password || '').length < 6) return fail('password_too_short');
      const { error } = await admin.auth.admin.updateUserById(b.id, { password: b.password });
      return error ? fail('not_found', 404) : json({ ok: true });
    }
    case 'deleteAccount': {
      const { data: row } = await admin.from('accounts').select('role').eq('id', b.id).maybeSingle();
      if (!row) return fail('not_found', 404);
      if (row.role === 'admin') return fail('cannot_delete_admin', 403);
      await admin.auth.admin.deleteUser(b.id);   // cascades to accounts and merchant_data
      return json({ ok: true });
    }
    case 'exportAll': {
      const [{ data: accounts }, { data: rows }, { data: plat }] = await Promise.all([
        admin.from('accounts').select('*').order('created_at'),
        admin.from('merchant_data').select('account_id, state'),
        admin.from('platform').select('settings').eq('id', 1).maybeSingle(),
      ]);
      const data = {}; (rows || []).forEach(r => { data[r.account_id] = r.state; });
      return json({ v: 4, schema: 5, source: 'supabase', exportedAt: new Date().toISOString(), platform: plat && plat.settings, accounts: (accounts || []).map(toAccount), data });
    }
    case 'importAll': {
      // Restores profiles and workspaces for accounts that still exist (matched by
      // username). Passwords can't be restored from a backup, so missing
      // accounts are skipped rather than recreated.
      const bk = b.backup;
      if (!bk || !Array.isArray(bk.accounts) || typeof bk.data !== 'object') return fail('invalid_backup');
      let restored = 0, skipped = 0;
      for (const a of bk.accounts) {
        if (a.role === 'admin') continue;
        const row = await findAccount(a.username);
        if (!row || !bk.data[a.id]) { skipped++; continue; }
        const patch = {}; PROFILE.forEach(k => { if (a[k] !== undefined) patch[k] = a[k]; });
        patch.mdr = a.mdr || {}; patch.gateway_locks = a.gatewayLocks || {};
        await admin.from('accounts').update(patch).eq('id', row.id);
        await admin.from('merchant_data').upsert({ account_id: row.id, state: bk.data[a.id], version: Math.floor(Date.now() / 1000), updated_at: new Date().toISOString() });
        restored++;
      }
      if (bk.platform && bk.platform.gateways) await admin.from('platform').update({ settings: bk.platform, updated_at: new Date().toISOString() }).eq('id', 1);
      return json({ restored, skipped });
    }
    case 'resetDemo': {
      const merchants = await seedDemoMerchants();
      return json({ merchants });
    }
  }
  return fail('unknown_action');
};

export const config = { path: '/api/account' };
