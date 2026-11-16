/* =====================================================================
   Mixx Business Lite — Store (v4)
   ---------------------------------------------------------------------
   The ONLY file that knows where accounts and data are kept.
   Stage 1 (this file): everything lives in this browser's localStorage.
   Stage 2: replace the bodies of the Store.* functions with Supabase
   calls (see supabase/schema.sql). Every function already returns a
   Promise, so app.js and admin.js do not need to change.

   Keys used:
     mbl_db_v4        { accounts:[...], data:{ <accountId>: <merchantState> } }
     mbl_session_v4   { uid, role }            (localStorage = "remember me")
     mbl_session_v4   { uid, role }            (sessionStorage = this tab only)
     mbl_guest_v4     <merchantState>          (sessionStorage — wiped when tab closes)
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- SHA-256 (pure JS, works on file:// and every browser) ---------- */
  function sha256(ascii) {
    function rightRotate(v, a) { return (v >>> a) | (v << (32 - a)); }
    const maxWord = Math.pow(2, 32); let result = '';
    const words = []; const asciiBitLength = ascii.length * 8;
    const hash = [], k = []; let primeCounter = 0; const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (let i = 0; i < ascii.length; i++) {
      const j = ascii.charCodeAt(i);
      if (j >> 8) return null;
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = ((asciiBitLength / maxWord) | 0);
    words[words.length] = (asciiBitLength);
    let H = hash.slice(0, 8);
    for (let j = 0; j < words.length;) {
      const w = words.slice(j, j += 16); const oldHash = H; H = H.slice(0, 8);
      for (let i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2]; const a = H[0], e = H[4];
        const temp1 = H[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & H[5]) ^ ((~e) & H[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
        const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & H[1]) ^ (a & H[2]) ^ (H[1] & H[2]));
        H = [(temp1 + temp2) | 0].concat(H); H[4] = (H[4] + temp1) | 0;
      }
      for (let i = 0; i < 8; i++) H[i] = (H[i] + oldHash[i]) | 0;
    }
    for (let i = 0; i < 8; i++) for (let j = 3; j + 1; j--) { const b = (H[i] >> (j * 8)) & 255; result += ((b < 16) ? 0 : '') + b.toString(16); }
    return result;
  }
  const utf8 = s => unescape(encodeURIComponent(s));
  function hashPassword(password, salt) { return sha256(utf8(salt + ':' + password)); }
  function newSalt() { let s = ''; for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16); return s; }
  function newId(prefix) { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* ---------- safe storage ---------- */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function ssDel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

  const DB_KEY = 'mbl_db_v4', SESSION_KEY = 'mbl_session_v4', GUEST_KEY = 'mbl_guest_v4';
  const clone = o => JSON.parse(JSON.stringify(o));
  const isoDaysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
  const dateDaysAgo = n => isoDaysAgo(n).slice(0, 10);

  /* ---------- sample data ---------- */
  const DEFAULT_METHODS = () => ([
    { id: 'mixx', name: 'Mixx Wallet', active: true, fee: '1.0%', settle: 'Instant, your Mixx Wallet' },
    { id: 'bank', name: 'Bank transfer', active: true, fee: '0.5%', settle: 'T+1, your bank account' },
    { id: 'card', name: 'Credit Card', active: false, fee: '2.9%', settle: 'T+2, your bank account' },
    { id: 'paypal', name: 'PayPal', active: false, fee: '3.4%', settle: 'T+2, your PayPal balance' },
  ]);
  const SWATCHES = ['#BEE8DF', '#F8D2E0', '#FBE3C4', '#DED4F5', '#CFE3F7', '#D8EFC8'];

  function emptyState(account) {
    const first = ((account && account.owner) || 'Cashier').split(' ')[0];
    return {
      v: 4,
      payout: { wallet: (account && account.phone) || '', bank: '', iban: '', holder: (account && account.business) || '' },
      clients: [], products: [], invoices: [], paymentLinks: [], transactions: [],
      payMethods: DEFAULT_METHODS(),
      posStats: { sales: 0, orders: 0 }, posSettings: { cashier: first, footer: 'Merci pour votre achat !' },
      notifications: [{ icon: '👋', text: 'Welcome to Mixx Business Lite', when: 'Today', unread: true, go: 'dashboard' }],
      kpiBase: { revenue: 0, active: 0, paid: 0, clients: 0 },
      trendBase: [0, 0, 0, 0, 0, 0],
      methodBase: { 'Mixx Wallet': 0, 'Bank transfer': 0, 'Card': 0, 'PayPal': 0 },
      nextInvoiceId: 1, nextLinkId: 1,
    };
  }

  /* Boutique Aissatou — the original prototype data */
  function demoState() {
    const s = emptyState({ owner: 'Ali', phone: '+221 77 123 45 67', business: 'Boutique Aissatou' });
    s.payout = { wallet: '+221 77 123 45 67', bank: 'CBAO Groupe Attijariwafa', iban: 'SN08 SN010 01234 567890123456 78', holder: 'Boutique Aissatou' };
    s.clients = [
      { id: 1, name: 'Mamadou Diop', phone: '+221 77 111 22 33', email: 'mamadou.d@gmail.com' },
      { id: 2, name: 'Fatou Sarr', phone: '+221 76 222 33 44', email: 'fatou.s@gmail.com' },
      { id: 3, name: 'Ibrahima Ndiaye', phone: '', email: '' },
      { id: 4, name: 'Cheikh Fall', phone: '+221 70 555 66 77', email: 'cheikh.fall@gmail.com' },
    ];
    s.products = [
      { id: 1, name: 'T-shirt coton', shortName: 'T-shirt', qty: 48, price: 4500, published: true, swatch: '#BEE8DF' },
      { id: 2, name: 'Casquette', shortName: 'Casquette', qty: 12, price: 2000, published: true, swatch: '#F8D2E0' },
      { id: 3, name: 'Ceinture homme', shortName: 'Ceinture', qty: 30, price: 5000, published: true, swatch: '#FBE3C4' },
      { id: 4, name: 'Sac à main cuir', shortName: 'Sac à main', qty: 6, price: 35000, published: false, swatch: '#DED4F5' },
      { id: 5, name: 'Sandales', shortName: 'Sandales', qty: 20, price: 18500, published: true, swatch: '#CFE3F7' },
      { id: 6, name: 'Portefeuille', shortName: 'Portefeuille', qty: 15, price: 12000, published: true, swatch: '#D8EFC8' },
    ];
    s.invoices = [
      { id: 1, num: '#1047', clientId: 1, type: 'express', items: [{ label: 'Repair service', price: 45000, qty: 1 }], date: dateDaysAgo(1), status: 'active' },
      { id: 2, num: '#1046', clientId: 2, type: 'express', items: [{ label: 'Custom order deposit', price: 12500, qty: 1 }], date: dateDaysAgo(1), status: 'active' },
      { id: 3, num: '#1045', clientId: 3, type: 'detailed', items: [{ label: 'Consulting session', price: 88200, qty: 1 }], date: dateDaysAgo(2), status: 'active' },
      { id: 4, num: '#1043', clientId: 4, type: 'detailed', items: [{ label: 'Wedding order', price: 120000, qty: 1 }], date: dateDaysAgo(4), status: 'paid' },
    ];
    s.paymentLinks = [
      { id: 1, title: 'Pop-up market booth fee', amount: 15000, type: 'reusable', collected: 135000, status: 'active' },
      { id: 2, title: 'Wholesale sample pack', amount: 40000, type: 'onetime', collected: 0, status: 'active' },
    ];
    s.transactions = [
      { label: '#1043 — Cheikh Fall', amount: 120000, method: 'Mixx Wallet', time: isoDaysAgo(0.1), seed: true },
      { label: 'Pop-up market booth fee', amount: 135000, method: 'Bank transfer', time: isoDaysAgo(0.2), seed: true },
    ];
    s.notifications = [
      { icon: '✅', text: 'Invoice #1043 was paid', when: '2 hours ago', unread: true, go: 'invoices' },
      { icon: '🏦', text: 'Payout sent to your Mixx Wallet', when: 'This morning', unread: true, go: 'integration' },
      { icon: '🛍️', text: 'New order from your online store', when: 'Yesterday', unread: false, go: 'store' },
      { icon: '📦', text: 'Stock low: Sac à main cuir (6 left)', when: '2 days ago', unread: false, go: 'products' },
    ];
    s.posStats = { sales: 842, orders: 14 };
    s.kpiBase = { revenue: 3420000, active: 12, paid: 120, clients: 32 };
    s.trendBase = [2600000, 3100000, 2900000, 3400000, 3000000, 3420000];
    s.methodBase = { 'Mixx Wallet': 1573200, 'Bank transfer': 820800, 'Card': 649800, 'PayPal': 376200 };
    s.nextInvoiceId = 5; s.nextLinkId = 3;
    return s;
  }

  /* A smaller merchant, used to show the admin panel with several accounts */
  function smallState(opts) {
    const s = emptyState({ owner: opts.owner, phone: opts.phone, business: opts.business });
    s.payout = { wallet: opts.phone, bank: opts.bank, iban: opts.iban, holder: opts.business };
    s.clients = opts.clients.map((c, i) => ({ id: i + 1, name: c[0], phone: c[1], email: c[2] }));
    s.products = opts.products.map((p, i) => ({ id: i + 1, name: p[0], shortName: p[0].split(' ')[0], qty: p[2], price: p[1], published: true, swatch: SWATCHES[i % 6] }));
    s.invoices = opts.invoices.map((v, i) => ({ id: i + 1, num: '#' + (1001 + i), clientId: v[0], type: v[3], items: [{ label: v[1], price: v[2], qty: 1 }], date: dateDaysAgo(v[4]), status: v[5] }));
    s.transactions = s.invoices.filter(i => i.status === 'paid').map((inv, i) => ({ label: inv.num + ' — ' + s.clients[inv.clientId - 1].name, amount: inv.items[0].price, method: ['Mixx Wallet', 'Bank transfer', 'Card'][i % 3], time: isoDaysAgo(inv.id), seed: true }));
    s.kpiBase = opts.kpiBase; s.trendBase = opts.trend; s.methodBase = opts.methods; s.posStats = opts.pos;
    s.nextInvoiceId = s.invoices.length + 1; s.nextLinkId = 1;
    s.notifications = [];
    return s;
  }

  function seedDatabase() {
    const accounts = []; const data = {};
    function add(acc, password, state) {
      const salt = newSalt();
      accounts.push(Object.assign({ status: 'active', plan: 'free', role: 'merchant', createdAt: isoDaysAgo(30), lastLogin: null }, acc, { salt, passHash: hashPassword(password, salt) }));
      if (state) data[acc.id] = state;
    }
    add({ id: 'u_admin', role: 'admin', username: 'admin', email: 'admin@mixx.africa', owner: 'Platform Admin', business: 'Mixx Business Lite', phone: '', city: 'Dakar, Sénégal', country: 'SN', createdAt: isoDaysAgo(120) }, 'Mixx@2026', null);
    add({ id: 'u_aissatou', username: 'aissatou', email: 'aissatou@mixx.africa', owner: 'Aïssatou Diallo', business: 'Boutique Aissatou', phone: '+221 77 123 45 67', city: 'Dakar, Sénégal', country: 'SN', plan: 'free', createdAt: isoDaysAgo(96), lastLogin: isoDaysAgo(1) }, 'demo123', demoState());
    add({ id: 'u_moussa', username: 'chezmoussa', email: 'moussa@chezmoussa.tg', owner: 'Moussa Ba', business: 'Chez Moussa', phone: '+228 90 11 22 33', city: 'Lomé, Togo', country: 'TG', plan: 'pro', createdAt: isoDaysAgo(54), lastLogin: isoDaysAgo(3) }, 'demo123',
      smallState({ owner: 'Moussa Ba', business: 'Chez Moussa', phone: '+228 90 11 22 33', bank: 'Ecobank Togo', iban: 'TG53 TG055 01020 304050607080 90',
        clients: [['Kossi Mensah', '+228 91 22 33 44', 'kossi.m@gmail.com'], ['Afi Amegah', '+228 92 44 55 66', ''], ['Hôtel du Lac', '+228 22 21 00 00', 'contact@hoteldulac.tg']],
        products: [['Poulet braisé', 3500, 40], ['Attiéké poisson', 2500, 60], ['Jus de bissap', 800, 120], ['Plateau traiteur', 45000, 8]],
        invoices: [[3, 'Traiteur — séminaire', 450000, 'detailed', 6, 'paid'], [1, 'Commande livraison', 18500, 'express', 2, 'paid'], [2, 'Anniversaire (acompte)', 60000, 'express', 1, 'active']],
        kpiBase: { revenue: 1850000, active: 6, paid: 48, clients: 21 }, trend: [900000, 1100000, 1250000, 1400000, 1600000, 1850000],
        methods: { 'Mixx Wallet': 1110000, 'Bank transfer': 425000, 'Card': 315000, 'PayPal': 0 }, pos: { sales: 312000, orders: 96 } }));
    add({ id: 'u_awa', username: 'awacouture', email: 'awa@awacouture.sn', owner: 'Awa Ndiaye', business: 'Awa Couture', phone: '+221 78 444 55 66', city: 'Saint-Louis, Sénégal', country: 'SN', plan: 'free', status: 'disabled', createdAt: isoDaysAgo(20), lastLogin: isoDaysAgo(12) }, 'demo123',
      smallState({ owner: 'Awa Ndiaye', business: 'Awa Couture', phone: '+221 78 444 55 66', bank: 'Banque Atlantique', iban: 'SN12 SN039 01001 000123456789 12',
        clients: [['Mariama Sow', '+221 77 900 11 22', 'mariama.sow@gmail.com'], ['Rokhaya Fall', '+221 76 300 44 55', '']],
        products: [['Boubou brodé', 25000, 10], ['Ensemble wax', 18000, 14]],
        invoices: [[1, 'Robe de mariée (acompte)', 75000, 'detailed', 9, 'paid'], [2, 'Retouches', 6000, 'express', 5, 'active']],
        kpiBase: { revenue: 240000, active: 1, paid: 9, clients: 7 }, trend: [0, 0, 40000, 60000, 90000, 240000],
        methods: { 'Mixx Wallet': 180000, 'Bank transfer': 60000, 'Card': 0, 'PayPal': 0 }, pos: { sales: 0, orders: 0 } }));
    return { v: 4, accounts, data };
  }

  /* ---------- v5: payment gateways, MDR, sample history ---------- */
  const GATEWAYS = [
    { id: 'mixx', name: 'Mixx Wallet', settle: 'Instant, your Mixx Wallet' },
    { id: 'bank', name: 'Bank transfer', settle: 'T+1, your bank account' },
    { id: 'card', name: 'Card', settle: 'T+2, your bank account' },
    { id: 'paypal', name: 'PayPal', settle: 'T+2, your PayPal balance' },
  ];
  const DEFAULT_PLATFORM = () => ({ gateways: { mixx: { mdr: 1.0, enabled: true }, bank: { mdr: 0.5, enabled: true }, card: { mdr: 2.9, enabled: true }, paypal: { mdr: 3.4, enabled: true } } });
  const METHOD_TO_GW = { 'Mixx Wallet': 'mixx', 'Bank transfer': 'bank', 'Card': 'card', 'PayPal': 'paypal', 'Cash': null };

  function rng(seed) { let x = 0; for (let i = 0; i < seed.length; i++) x = (x * 31 + seed.charCodeAt(i)) >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
  function pickW(r, items) { const t = items.reduce((a, b) => a + b[1], 0); let v = r() * t; for (const [k, w] of items) { if ((v -= w) <= 0) return k; } return items[0][0]; }

  /* ~180 days of realistic transactions for a demo merchant */
  function addHistory(state, seed, scale, weights) {
    const r = rng(seed); const now = new Date(); const out = []; const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let invNum = 101; const newInvoices = [];
    for (let d = 180; d >= 0; d--) {
      const day = new Date(now); day.setDate(now.getDate() - d);
      const growth = 0.75 + 0.25 * (1 - d / 180);
      const n = Math.max(1, Math.round((2 + r() * 5) * growth * (day.getDay() === 0 ? 0.5 : 1)));
      for (let k = 0; k < n; k++) {
        const t = new Date(day); t.setHours(8 + Math.floor(r() * 12), Math.floor(r() * 60), 0, 0);
        if (t > now) continue;
        const method = pickW(r, weights);
        const amount = Math.round((3000 + r() * r() * 60000) * scale / 500) * 500;
        const hasClient = state.clients.length && r() < 0.45;
        const clientId = hasClient ? state.clients[Math.floor(r() * state.clients.length)].id : null;
        const L = { 'Cash': ['Counter sale'], 'Mixx Wallet': ['Mixx Wallet payment', 'Payment link', 'Online store order', 'QR payment'], 'Bank transfer': ['Bank transfer'], 'Card': ['Online store order', 'Payment link', 'Card payment'], 'PayPal': ['PayPal payment'] }[method];
        let label = L[Math.floor(r() * L.length)];
        if (clientId && t < monthStart && r() < 0.5) {
          const num = '#' + String(invNum++).padStart(4, '0');
          newInvoices.push({ id: 10000 + invNum, num, clientId, type: r() < 0.5 ? 'express' : 'detailed', items: [{ label: 'Order ' + num, price: amount, qty: 1 }], date: t.toISOString().slice(0, 10), status: 'paid' });
          label = num + ' — ' + state.clients.find(c => c.id === clientId).name;
        }
        out.push({ label, amount, method, time: t.toISOString(), clientId, pos: method === 'Cash', hist: true });
      }
    }
    state.invoices = state.invoices.concat(newInvoices);
    state.transactions = out.reverse().concat(state.transactions.filter(t => !t.seed));
    state.historyV5 = true;
    return state;
  }
  function withFees(state, acc, platform) {
    (state.transactions || []).forEach(t => {
      if (t.fee !== undefined) return;
      const gw = METHOD_TO_GW[t.method]; const mdr = gw ? effMdr(acc, platform, gw) : 0;
      t.mdr = mdr; t.fee = Math.round(t.amount * mdr / 100); t.net = t.amount - t.fee;
    });
    return state;
  }
  function effMdr(acc, platform, gw) {
    const o = acc && acc.mdr && acc.mdr[gw];
    return (o !== undefined && o !== null && o !== '') ? Number(o) : Number(platform.gateways[gw].mdr);
  }
  function upgradeState(state, acc, platform) {
    if (!state) return state;
    const ids = new Set((state.payMethods || []).map(m => m.id));
    state.payMethods = (state.payMethods || []).filter(m => GATEWAYS.some(g => g.id === m.id));
    GATEWAYS.forEach(g => { if (!ids.has(g.id)) state.payMethods.push({ id: g.id, name: g.name, active: false }); });
    state.payMethods.forEach(m => { const g = GATEWAYS.find(x => x.id === m.id); m.name = g.name; m.settle = g.settle; delete m.fee; });
    return withFees(state, acc, platform);
  }
  function migrate(db) {
    if (db.schema === 5) return false;
    db.platform = db.platform || DEFAULT_PLATFORM();
    db.accounts.forEach(a => { a.mdr = a.mdr || {}; a.gatewayLocks = a.gatewayLocks || {}; });
    const demo = { u_aissatou: ['aissatou', 1, [['Mixx Wallet', 46], ['Bank transfer', 20], ['Card', 18], ['Cash', 16]]],
                   u_moussa: ['moussa', 0.7, [['Mixx Wallet', 55], ['Bank transfer', 15], ['Card', 12], ['Cash', 18]]],
                   u_awa: ['awa', 0.35, [['Mixx Wallet', 70], ['Bank transfer', 30]]] };
    Object.keys(db.data).forEach(id => {
      const st = db.data[id]; const acc = db.accounts.find(a => a.id === id);
      if (demo[id] && !st.historyV5) {
        if (id === 'u_aissatou') { (st.payMethods || []).forEach(m => { if (m.id === 'card') m.active = true; }); }
        if (id === 'u_moussa') { (st.payMethods || []).forEach(m => { if (m.id === 'card') m.active = true; }); }
        addHistory(st, demo[id][0], demo[id][1], demo[id][2]);
      }
      upgradeState(st, acc, db.platform);
    });
    db.schema = 5; return true;
  }

  /* ---------- database (localStorage) ---------- */
  let DB = null;
  function loadDB() {
    if (DB) return DB;
    try { DB = JSON.parse(lsGet(DB_KEY) || 'null'); } catch (e) { DB = null; }
    if (!DB || DB.v !== 4 || !Array.isArray(DB.accounts)) { DB = seedDatabase(); }
    if (migrate(DB) || !lsGet(DB_KEY)) saveDB();
    return DB;
  }
  function saveDB() {
    if (!lsSet(DB_KEY, JSON.stringify(DB))) { const e = new Error('storage_full'); e.code = 'storage_full'; throw e; }
  }
  const publicAccount = a => { if (!a) return null; const c = clone(a); delete c.passHash; delete c.salt; return c; };
  const fail = code => { const e = new Error(code); e.code = code; return Promise.reject(e); };
  const norm = s => String(s || '').trim().toLowerCase();

  const Store = {
    backend: 'browser',

    /* ---- accounts ---- */
    register(input) {
      const db = loadDB();
      const username = norm(input.username), email = norm(input.email);
      if (!/^[a-z0-9._-]{3,20}$/.test(username)) return fail('username_invalid');
      if (db.accounts.some(a => a.username === username)) return fail('username_taken');
      if (db.accounts.some(a => norm(a.email) === email)) return fail('email_taken');
      const salt = newSalt();
      const acc = {
        id: newId('u'), role: 'merchant', status: 'active', username, email: input.email.trim(),
        owner: input.owner.trim(), business: input.business.trim(), phone: input.phone.trim(),
        city: input.city, country: input.country, plan: input.plan || 'free',
        createdAt: new Date().toISOString(), lastLogin: new Date().toISOString(), salt, passHash: hashPassword(input.password, salt),
        mdr: {}, gatewayLocks: {},
      };
      db.accounts.push(acc); db.data[acc.id] = emptyState(acc);
      try { saveDB(); } catch (e) { db.accounts.pop(); delete db.data[acc.id]; return Promise.reject(e); }
      return Promise.resolve(publicAccount(acc));
    },
    login(identifier, password) {
      const db = loadDB(); const id = norm(identifier);
      const acc = db.accounts.find(a => a.username === id || norm(a.email) === id);
      if (!acc || acc.passHash !== hashPassword(password, acc.salt)) return fail('invalid_credentials');
      if (acc.status !== 'active') return fail('account_disabled');
      acc.lastLogin = new Date().toISOString(); saveDB();
      return Promise.resolve(publicAccount(acc));
    },
    getAccount(id) { return Promise.resolve(publicAccount(loadDB().accounts.find(a => a.id === id))); },
    listAccounts() { return Promise.resolve(loadDB().accounts.map(publicAccount)); },
    updateAccount(id, patch) {
      const db = loadDB(); const acc = db.accounts.find(a => a.id === id); if (!acc) return fail('not_found');
      const allowed = ['owner', 'business', 'email', 'phone', 'city', 'country', 'plan', 'status', 'mdr', 'gatewayLocks'];
      if (patch.email && db.accounts.some(a => a.id !== id && norm(a.email) === norm(patch.email))) return fail('email_taken');
      allowed.forEach(k => { if (patch[k] !== undefined) acc[k] = patch[k]; });
      saveDB(); return Promise.resolve(publicAccount(acc));
    },
    setPassword(id, password) {
      const db = loadDB(); const acc = db.accounts.find(a => a.id === id); if (!acc) return fail('not_found');
      acc.salt = newSalt(); acc.passHash = hashPassword(password, acc.salt); saveDB(); return Promise.resolve(true);
    },
    changePassword(id, current, next) {
      const acc = loadDB().accounts.find(a => a.id === id); if (!acc) return fail('not_found');
      if (acc.passHash !== hashPassword(current, acc.salt)) return fail('wrong_password');
      return Store.setPassword(id, next);
    },
    deleteAccount(id) {
      const db = loadDB(); const acc = db.accounts.find(a => a.id === id);
      if (!acc) return fail('not_found'); if (acc.role === 'admin') return fail('cannot_delete_admin');
      db.accounts = db.accounts.filter(a => a.id !== id); delete db.data[id]; saveDB(); return Promise.resolve(true);
    },

    /* ---- merchant data ---- */
    getData(id) { const db = loadDB(); return Promise.resolve(db.data[id] ? clone(db.data[id]) : null); },
    getDataSync(id) { const db = loadDB(); return db.data[id] ? clone(db.data[id]) : null; },
    saveData(id, state) { const db = loadDB(); if (!db.accounts.some(a => a.id === id)) return fail('not_found'); db.data[id] = clone(state); saveDB(); return Promise.resolve(true); },
    allData() { return Promise.resolve(clone(loadDB().data)); },

    /* ---- guest (this tab only) ---- */
    guestState() { try { const s = JSON.parse(ssGet(GUEST_KEY) || 'null'); if (s && s.v === 4) return s; } catch (e) {} const s = demoState(); s.payMethods.forEach(m => { if (m.id === 'card') m.active = true; }); addHistory(s, 'guest', 1, [['Mixx Wallet', 46], ['Bank transfer', 20], ['Card', 18], ['Cash', 16]]); upgradeState(s, null, loadDB().platform); ssSet(GUEST_KEY, JSON.stringify(s)); return s; },
    saveGuestState(state) { ssSet(GUEST_KEY, JSON.stringify(state)); },
    clearGuest() { ssDel(GUEST_KEY); },

    /* ---- session ---- */
    session: {
      get() { try { return JSON.parse(ssGet(SESSION_KEY) || lsGet(SESSION_KEY) || 'null'); } catch (e) { return null; } },
      set(sess, remember) { const v = JSON.stringify(sess); if (remember && !sess.guest) { lsSet(SESSION_KEY, v); ssDel(SESSION_KEY); } else { ssSet(SESSION_KEY, v); lsDel(SESSION_KEY); } },
      clear() { lsDel(SESSION_KEY); ssDel(SESSION_KEY); },
    },

    /* ---- backup / restore / reset ---- */
    exportAll() { return Promise.resolve(clone(loadDB())); },
    importAll(obj) {
      if (obj && obj.v === 4 && obj.schema !== 5) { try { migrate(obj); } catch (e) {} }
      if (!obj || obj.v !== 4 || !Array.isArray(obj.accounts) || typeof obj.data !== 'object') return fail('invalid_backup');
      if (!obj.accounts.some(a => a.role === 'admin')) return fail('invalid_backup');
      const prev = DB; DB = clone(obj);
      try { saveDB(); } catch (e) { DB = prev; return Promise.reject(e); }
      return Promise.resolve(true);
    },
    resetAll() { DB = seedDatabase(); migrate(DB); saveDB(); Store.clearGuest(); return Promise.resolve(true); },

    emptyState, demoState,

    /* ---- v5: platform gateway settings (admin) ---- */
    GATEWAYS, METHOD_TO_GW,
    getPlatform() { return Promise.resolve(clone(loadDB().platform)); },
    getPlatformSync() { return clone(loadDB().platform); },
    savePlatform(p) { const db = loadDB(); db.platform = clone(p); saveDB(); return Promise.resolve(true); },
    effMdr(acc, gw) { return effMdr(acc, loadDB().platform, gw); },
    upgradeState(state, acc) { return upgradeState(state, acc, loadDB().platform); },
  };
  window.Store = Store;
})();
