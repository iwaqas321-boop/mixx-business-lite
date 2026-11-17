/* Public checkout for invoices, payment links and store products.
   GET  /api/checkout?owner=<accountId>&kind=invoice|link|product&id=<n>
        -> { account, state } with only what the checkout page needs.
   POST /api/checkout { owner, kind, id, method, via }
        -> records the (sandbox) payment in the merchant's workspace.
   Customers aren't signed in, so they never get the merchant's full data. */
import { admin, json, fail, readJson, toAccount, getPlatform, updateState, legacyStore } from '../lib/core.mjs';

const KINDS = ['invoice', 'link', 'product'];
const fmtMoney = n => new Intl.NumberFormat('en-US').format(Math.round(n)) + ' XOF';
const invoiceTotal = inv => (inv.items || []).reduce((s, i) => s + i.price * i.qty, 0);

function findItem(state, kind, id) {
  if (kind === 'invoice') return (state.invoices || []).find(i => i.id === id);
  if (kind === 'link') return (state.paymentLinks || []).find(l => l.id === id);
  return (state.products || []).find(p => p.id === id);
}

async function loadMerchant(owner) {
  if (!/^[0-9a-f-]{36}$/i.test(owner || '')) return null;
  const { data } = await admin.from('accounts').select('*').eq('id', owner).maybeSingle();
  return data && data.status === 'active' && data.role === 'merchant' ? data : null;
}

export default async (req) => {
  if (req.method === 'GET') {
    const q = new URL(req.url).searchParams;
    const owner = q.get('owner'), kind = q.get('kind'), id = parseInt(q.get('id'), 10);
    if (!KINDS.includes(kind)) return fail('not_found', 404);
    const row = await loadMerchant(owner); if (!row) return fail('not_found', 404);
    const { data: md } = await admin.from('merchant_data').select('state').eq('account_id', owner).maybeSingle();
    const full = md && md.state; const item = full && findItem(full, kind, id);
    if (!item) return fail('not_found', 404);

    const acc = toAccount(row);
    const state = legacyStore().emptyState(acc);
    Object.assign(state, { payMethods: full.payMethods, payout: full.payout, notifications: [], historyV5: true });
    if (kind === 'invoice') { state.invoices = [item]; state.clients = (full.clients || []).filter(c => c.id === item.clientId); }
    if (kind === 'link') state.paymentLinks = [item];
    if (kind === 'product') state.products = [item];
    const account = { id: acc.id, role: 'merchant', status: 'active', username: '', email: '', owner: acc.owner, business: acc.business,
      phone: acc.phone, city: acc.city, country: acc.country, plan: acc.plan, mdr: acc.mdr, gatewayLocks: acc.gatewayLocks };
    return json({ account, state });
  }

  if (req.method !== 'POST') return fail('method_not_allowed', 405);
  const b = await readJson(req);
  const id = parseInt(b.id, 10);
  const L = legacyStore();
  if (!KINDS.includes(b.kind) || !(b.method in L.METHOD_TO_GW) || b.method === 'Cash') return fail('invalid_request');
  const row = await loadMerchant(b.owner); if (!row) return fail('not_found', 404);
  const acc = toAccount(row); const platform = await getPlatform();
  const gw = L.METHOD_TO_GW[b.method];
  const mdr = Number((acc.mdr && acc.mdr[gw] !== undefined && acc.mdr[gw] !== '' && acc.mdr[gw] !== null) ? acc.mdr[gw] : platform.gateways[gw].mdr);

  // Same changes the prototype's checkoutContext().onPaid + checkoutConfirm() make
  const result = await updateState(acc.id, state => {
    const item = findItem(state, b.kind, id); if (!item) return false;
    let sub, amount, clientId = null;
    state.notifications = state.notifications || []; state.transactions = state.transactions || [];
    if (b.kind === 'invoice') {
      if (item.status === 'paid') return { error: 'already_paid' };
      sub = item.num; amount = invoiceTotal(item); clientId = item.clientId; item.status = 'paid';
    } else if (b.kind === 'link') {
      if (item.type === 'onetime' && item.status === 'paid') return { error: 'already_paid' };
      sub = item.title; amount = item.type === 'reusable' ? (item.amount || 10000) : item.amount;
      item.collected = (item.collected || 0) + amount; if (item.type === 'onetime') item.status = 'paid';
    } else {
      sub = item.name; amount = item.price; if (item.qty > 0) item.qty--;
      state.notifications.unshift({ icon: '🛍️', text: 'New order from your online store', when: 'Today', unread: true, go: 'dashboard' });
    }
    const fee = Math.round(amount * mdr / 100);
    state.transactions.unshift({ label: sub + (b.via === 'qr' ? ' (QR)' : ''), amount, method: b.method, time: new Date().toISOString(),
      clientId, mdr, fee, net: amount - fee, qr: b.via === 'qr' });
    state.notifications.unshift({ icon: '💰', text: sub + ' · ' + fmtMoney(amount) + ' collected.', when: 'Today', unread: true, go: 'dashboard' });
    state.notifications = state.notifications.slice(0, 20);
    return { ok: true, amount, fee };
  });
  if (result === null || result === false) return fail('not_found', 404);
  if (result.error) return fail(result.error, 409);
  return json(result);
};

export const config = { path: '/api/checkout' };
