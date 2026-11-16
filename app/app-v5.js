/* =====================================================================
   Mixx Business Lite — v5
   Payment methods (on/off + MDR), interop QR checkout, new dashboard
   with filters and charts, reports with PDF, admin gateway controls.
   Loaded after app.js / admin.js: functions declared here replace theirs.
   ===================================================================== */

/* ---------- payment methods ---------- */
const GW_IDS = ['mixx', 'bank', 'card', 'paypal'];
const GW_NAME = { mixx: 'Mixx Wallet', bank: 'Bank transfer', card: 'Card', paypal: 'PayPal', cash: 'Cash' };
const GW_OF_METHOD = { 'Mixx Wallet': 'mixx', 'Bank transfer': 'bank', 'Card': 'card', 'PayPal': 'paypal', 'Cash': 'cash' };
/* Categorical order validated with the dataviz palette checker (light surface): */
const GW_COLOR = { mixx: '#2463C2', bank: '#CF9C00', card: '#5FA0EC', paypal: '#9C7700', cash: '#7C8799' };
const GW_ICON = { mixx: '📱', bank: '🏦', card: '💳', paypal: '🌐', cash: '💵' };

function platformCfg(){ return Store.getPlatformSync(); }
function gwMdr(id){ if(id==='cash') return 0; return Store.effMdr(account, id); }
function gwLocked(id){ return !!(account && account.gatewayLocks && account.gatewayLocks[id]); }
function gwPlatformOn(id){ const p = platformCfg(); return !!(p.gateways[id] && p.gateways[id].enabled); }
function gwMerchantOn(id){ const m = payMethods.find(x=>x.id===id); return !!(m && m.active); }
function gwActive(id){ return gwMerchantOn(id) && gwPlatformOn(id) && !gwLocked(id); }
function gwHasSpecialRate(id){ return !!(account && account.mdr && account.mdr[id] !== undefined && account.mdr[id] !== null && account.mdr[id] !== ''); }
function fmtPct(v){ return (Math.round(v*100)/100).toLocaleString(APP_LANG==='fr'?'fr-FR':'en-US', {minimumFractionDigits:1, maximumFractionDigits:2}) + '%'; }
function ensureFees(){
  transactions.forEach(t=>{
    if(t.fee !== undefined) return;
    const mdr = gwMdr(GW_OF_METHOD[t.method] || 'mixx');
    t.mdr = mdr; t.fee = Math.round(t.amount * mdr / 100); t.net = t.amount - t.fee;
  });
}
function gwStatus(id){
  if(!gwPlatformOn(id)) return { key:'platform', label:'Unavailable', cls:'st-off' };
  if(gwLocked(id)) return { key:'locked', label:'Disabled by admin', cls:'st-locked' };
  if(gwMerchantOn(id)) return { key:'on', label:'Active', cls:'st-on' };
  return { key:'off', label:'Off', cls:'st-off' };
}
function toggleGateway(id){
  const st = gwStatus(id);
  if(st.key==='platform'){ pushToast('Not available', GW_NAME[id]+' is switched off for all merchants.'); return; }
  if(st.key==='locked'){ pushToast('Disabled by admin', 'Contact your Mixx account manager to use '+GW_NAME[id]+'.'); return; }
  let m = payMethods.find(x=>x.id===id);
  if(!m){ m = { id, name:GW_NAME[id], active:false }; payMethods.push(m); }
  m.active = !m.active;
  renderMethods(); renderIcMethods(); renderDashboard(); persistSoon();
  pushToast(m.active ? 'Method activated' : 'Method deactivated', GW_NAME[id] + (m.active ? ' is now active.' : ' is now off.'));
}
function activateMethod(btn, name){ const id = btn && btn.dataset.method ? btn.dataset.method : GW_OF_METHOD[name] || 'card'; if(!gwMerchantOn(id)) toggleGateway(id); }

function renderMethods(){
  const box = document.getElementById('gw-cards'); if(!box) return;
  ensureFees();
  const since = periodRange('month').from;
  box.innerHTML = GW_IDS.map(id=>{
    const st = gwStatus(id); const mdr = gwMdr(id);
    const tx = transactions.filter(t=> GW_OF_METHOD[t.method]===id && new Date(t.time)>=since);
    const vol = tx.reduce((a,t)=>a+t.amount,0), fees = tx.reduce((a,t)=>a+(t.fee||0),0);
    const disabled = st.key==='locked' || st.key==='platform';
    const settle = (payMethods.find(m=>m.id===id)||{}).settle || '';
    return `<div class="card gw-card ${st.key==='on'?'':'is-off'}">
      <div class="gw-head"><span class="gw-dot" style="background:${GW_COLOR[id]}"></span><strong>${T(GW_NAME[id])}</strong>
        <span class="gw-status ${st.cls}">${T(st.label)}</span>
        <button class="toggle ${gwMerchantOn(id)&&!disabled?'on':''}" ${disabled?'disabled':''} onclick="toggleGateway('${id}')" aria-label="${T('Turn on or off')}: ${T(GW_NAME[id])}" title="${disabled?T(st.label):T(gwMerchantOn(id)?'Deactivate':'Activate')}"></button></div>
      <div class="gw-mdr"><span class="tabular">${fmtPct(mdr)}</span><small>${T('MDR per transaction')}${gwHasSpecialRate(id)?' · '+T('special rate'):''}</small></div>
      <div class="gw-meta"><div><span>${T('Settlement')}</span><strong>${T(settle)}</strong></div><div><span>${T('This month')}</span><strong class="tabular">${fmtMoney(vol)}</strong></div><div><span>${T('Fees this month')}</span><strong class="tabular">${fmtMoney(fees)}</strong></div></div>
    </div>`;
  }).join('');
  const sel = document.getElementById('calc-method'); const cur = sel.value;
  sel.innerHTML = GW_IDS.map(id=>`<option value="${id}">${T(GW_NAME[id])} — ${fmtPct(gwMdr(id))}</option>`).join('');
  if(cur) sel.value = cur;
  renderCalc();
}
function renderCalc(){
  const amtEl = document.getElementById('calc-amount'); if(!amtEl) return;
  const amt = Math.max(0, parseFloat(amtEl.value)||0); const id = document.getElementById('calc-method').value || 'mixx';
  const fee = Math.round(amt*gwMdr(id)/100);
  document.getElementById('calc-out').innerHTML = `<div><span>${T('Customer pays')}</span><strong class="tabular">${fmtMoney(amt)}</strong></div><div><span>${T('Fee')} (${fmtPct(gwMdr(id))})</span><strong class="tabular">−${fmtMoney(fee)}</strong></div><div class="net"><span>${T('You receive')}</span><strong class="tabular">${fmtMoney(amt-fee)}</strong></div>`;
  document.getElementById('calc-table').innerHTML = GW_IDS.map(g=>{ const f = Math.round(amt*gwMdr(g)/100); return `<tr class="${gwActive(g)?'':'row-muted'}"><td><span class="gw-dot" style="background:${GW_COLOR[g]}"></span> ${T(GW_NAME[g])}</td><td class="tabular">${fmtPct(gwMdr(g))}</td><td class="tabular">${fmtMoney(f)}</td><td class="tabular row-name">${fmtMoney(amt-f)}</td></tr>`; }).join('');
}
function renderIcMethods(){
  const box = document.getElementById('ic-methods'); if(!box) return;
  box.innerHTML = GW_IDS.map(id=>{
    const st = gwStatus(id); const disabled = st.key==='locked' || st.key==='platform';
    return `<div class="toggle-row ic-gw"><span><span class="gw-dot" style="background:${GW_COLOR[id]}"></span> ${T(GW_NAME[id])} <small class="muted">${fmtPct(gwMdr(id))}</small>${disabled?` <small class="gw-status ${st.cls}">${T(st.label)}</small>`:''}</span>
      <button class="toggle ${gwMerchantOn(id)&&!disabled?'on':''}" ${disabled?'disabled':''} onclick="toggleGateway('${id}')" aria-label="${T(GW_NAME[id])}"></button></div>`;
  }).join('');
}

/* ---------- EMVCo merchant-presented QR (interoperable) ---------- */
function emvTLV(id, v){ v = String(v); return id + String(v.length).padStart(2,'0') + v; }
function crc16(str){
  let crc = 0xFFFF;
  for(let i=0;i<str.length;i++){ crc ^= str.charCodeAt(i) << 8; for(let j=0;j<8;j++){ crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1); crc &= 0xFFFF; } }
  return crc.toString(16).toUpperCase().padStart(4,'0');
}
function asciiUpper(s, max){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9 .&-]/g,'').toUpperCase().slice(0,max).trim() || 'MERCHANT'; }
function merchantQrId(){
  const src = (account && account.id) || 'guest'; let h = 7;
  for(const c of src) h = (h*31 + c.charCodeAt(0)) % 1000000000;
  return 'MXB' + String(h).padStart(9,'0');
}
function buildEmvPayload(amount, reference){
  const country = (account && account.country) || 'SN';
  const city = asciiUpper((merchant.city||'Dakar').split(',')[0], 15);
  let p = emvTLV('00','01') + emvTLV('01','12')
    + emvTLV('26', emvTLV('00','COM.MIXXBYYAS.INTEROP') + emvTLV('01', merchantQrId()))
    + emvTLV('52','5999') + emvTLV('53','952') + emvTLV('54', String(Math.round(amount)))
    + emvTLV('58', country) + emvTLV('59', asciiUpper(merchant.name, 25)) + emvTLV('60', city)
    + emvTLV('62', emvTLV('05', String(reference).replace(/[^A-Za-z0-9-]/g,'').slice(0,25) || 'REF') + emvTLV('07','MXBWEB'));
  p += '6304';
  return p + crc16(p);
}
function qrSvg(text, size){
  if(typeof qrcode !== 'function') return '';
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(); let d = '';
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(q.isDark(r,c)) d += `M${c},${r}h1v1h-1z`;
  return `<svg viewBox="-2 -2 ${n+4} ${n+4}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="${T('Payment QR code')}"><rect x="-2" y="-2" width="${n+4}" height="${n+4}" fill="#fff"/><path d="${d}" fill="#00377D"/></svg>`;
}

/* ---------- checkout ---------- */
function renderCheckoutCard(kind, id, activeMethod, containerId){
  containerId = containerId || 'checkout-card';
  const available = GW_IDS.filter(gwActive);
  if(!available.includes(activeMethod)) activeMethod = available[0] || 'mixx';
  checkoutMethod = activeMethod;
  const ctx = checkoutContext(kind, id);
  const card = document.getElementById(containerId); if(!card) return;
  const isStandalone = containerId==='checkout-card';
  const payload = buildEmvPayload(ctx.amount, ctx.sub);
  const labelOf = k => k==='mixx' ? 'Mixx Wallet' : k==='card' ? `<div class="card-marks"><span class="card-mark-visa">VISA</span><span class="card-mark-mc"><span></span><span></span></span></div>` : k==='paypal' ? 'PayPal' : 'Bank transfer';
  card.innerHTML = `
    <div class="checkout-head">
      ${isStandalone ? `<button class="ch-back" onclick="backToDashboard()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>${T(currentSession() ? 'Back to dashboard' : 'Back')}</button>` : ''}
      <div class="ch-row">
        <div class="ch-info">
          <div class="ch-merchant">${esc(merchant.name)}</div>
          <div class="ch-title">${esc(ctx.title)} · ${esc(ctx.sub)}</div>
          <div class="ch-due">${T('Amount due')}</div>
          <div class="amt tabular">${fmtMoney(ctx.amount)}</div>
        </div>
        <div class="ch-qr">
          <div class="ch-qr-box" title="${T('Interoperable QR — scan with Mixx by Yas or any interoperable wallet or bank app')}">${qrSvg(payload, 116)}</div>
          <div class="ch-qr-cap">${T('Scan & pay')}</div>
          <div class="ch-qr-sub">${T('Any wallet or bank app')}</div>
        </div>
      </div>
    </div>
    <div class="checkout-body">
      <div class="checkout-sandbox-note">⚠️ Sandbox checkout — this is a demo environment, no real funds move.</div>
      <div class="qr-note"><span>📱</span><div><strong>${T('Pay by QR')}</strong> — ${T('open Mixx by Yas or any interoperable wallet or bank app, scan the code above and confirm.')}
        <button class="btn-text" onclick="checkoutConfirm('${kind}', ${id}, '${containerId}', 'qr')">${T('Simulate a scan (demo)')}</button></div></div>
      ${ctx.lines.map(l=>`<div class="checkout-line"><span>${esc(l.label)}</span><span class="tabular">${fmtMoney(l.amount)}</span></div>`).join('')}
      <div class="or-row">${T('or pay here')}</div>
      ${available.length ? `<div class="pm-tabs" style="grid-template-columns:repeat(${available.length},1fr)">
        ${available.map(k=>`<div class="pm-tab ${k==='mixx'?'mixx':k==='paypal'?'paypal':''} ${k===activeMethod?'active':''}" onclick="renderCheckoutCard('${kind}', ${id}, '${k}', '${containerId}')">${labelOf(k)}</div>`).join('')}
      </div>
      <div class="pm-form" id="${containerId}-form"></div>` : `<div class="empty-note">${T('No payment method is active for this merchant.')}</div>`}
    </div>`;
  const form = document.getElementById(containerId+'-form'); if(!form) return;
  const payBtn = `<button class="btn btn-green" style="justify-content:center;margin-top:4px;" onclick="checkoutConfirm('${kind}', ${id}, '${containerId}')">${T('Pay now — '+fmtMoney(ctx.amount))}</button>`;
  if(activeMethod==='card') form.innerHTML = `<div class="field"><label>Card number</label><input class="mono" value="4242 4242 4242 4242"/></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"><div class="field"><label>Expiry</label><input class="mono" value="09/29"/></div><div class="field"><label>CVV</label><input class="mono" value="•••"/></div></div>
      <div class="pm-note">Card details are tokenised — Mixx Business never stores the full card number.</div>${payBtn}`;
  else if(activeMethod==='paypal') form.innerHTML = `<div class="field"><label>PayPal e-mail</label><input value="customer@example.com"/></div><div class="pm-note">The customer confirms this payment by logging into PayPal.</div>${payBtn}`;
  else if(activeMethod==='bank') form.innerHTML = `<div class="pm-note">${T('Transfer to: '+merchant.name+' — IBAN '+(payout.iban||'SN08 XXXX XXXX XXXX')+' — reference '+ctx.sub+'.')}</div>
      <button class="btn btn-green" style="justify-content:center;margin-top:4px;" onclick="checkoutConfirm('${kind}', ${id}, '${containerId}')">I've sent the transfer</button>`;
  else form.innerHTML = `<div class="field"><label>Mixx Wallet number</label><input class="mono" value="+221 77 000 00 00"/></div><div class="pm-note">The customer confirms this payment in their Mixx app or with their PIN.</div>${payBtn}`;
  if(isStandalone) document.getElementById('checkout-footer').textContent = "Payments are encrypted and processed by Mixx Business's licensed payment partners.";
}
function checkoutConfirm(kind, id, containerId, via){
  containerId = containerId || 'checkout-card';
  const card = document.getElementById(containerId);
  const method = via==='qr' ? 'Mixx Wallet' : ({mixx:'Mixx Wallet',card:'Card',paypal:'PayPal',bank:'Bank transfer'})[checkoutMethod] || 'Mixx Wallet';
  card.innerHTML = `<div class="checkout-body" style="padding-top:40px;"><div class="pay-success">
    <div class="ring"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div style="font-weight:700;font-size:15px;">${T(via==='qr' ? 'Waiting for the customer to confirm in their app…' : 'Confirming with your provider…')}</div></div></div>`;
  setTimeout(()=>{
    const ref = 'MXB-' + Math.random().toString(36).slice(2,8).toUpperCase();
    const ctx = checkoutContext(kind, id);
    const inv = kind==='invoice' ? invoices.find(i=>i.id===id) : null;
    const mdr = gwMdr(GW_OF_METHOD[method]); const fee = Math.round(ctx.amount*mdr/100);
    card.innerHTML = `<div class="checkout-body" style="padding-top:36px;"><div class="pay-success">
      <div class="ring"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div style="font-weight:700;font-size:17px;">${T('Payment confirmed')}</div>
      <div class="page-sub" style="margin:0;">${T('Receipt '+ref+' · a copy was sent by SMS.')}</div>
      <div class="receipt-split"><div><span>${T('Paid')}</span><strong>${fmtMoney(ctx.amount)}</strong></div><div><span>${T('MDR')} ${fmtPct(mdr)}</span><strong>−${fmtMoney(fee)}</strong></div><div><span>${T('Merchant receives')}</span><strong>${fmtMoney(ctx.amount-fee)}</strong></div></div>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="backToDashboard()">${T('← Back to dashboard')}</button>
    </div></div>`;
    ctx.onPaid();
    transactions.unshift({ label: ctx.sub + (via==='qr' ? ' (QR)' : ''), amount: ctx.amount, method, time: new Date().toISOString(), clientId: inv ? inv.clientId : null, mdr, fee, net: ctx.amount-fee, qr: via==='qr' });
    renderDashboard(); renderTxHistory(); persistSoon();
    addNotification('💰', ctx.sub+' · '+fmtMoney(ctx.amount)+' collected.', 'Today');
    pushToast('Payment confirmed', ctx.sub+' · '+fmtMoney(ctx.amount)+' collected.');
  }, 1000);
}

/* ---------- POS ---------- */
function renderPosMethodTabs(){
  const methods = ['Cash (POS)'].concat(gwActive('card') ? ['Card (POS)'] : []).concat(['Online']);
  if(!methods.includes(posMethod)) posMethod = 'Cash (POS)';
  document.getElementById('pos-method-tabs').innerHTML = methods.map(m=>`<button class="pos-method-tab ${m===posMethod?'active':''}" onclick="posSetMethod('${m}')">${T(m)}</button>`).join('');
}
function posPay(){
  const gross = posOrder.reduce((s,l)=> s + products.find(p=>p.id===l.productId).price*l.qty, 0);
  const subtotal = gross - Math.round(gross * (parseFloat(document.getElementById('pos-discount').value)||0) / 100);
  if(!subtotal){ pushToast('Nothing to charge', 'Add a product to the order first.'); return; }
  if(posMethod === 'Online'){
    exitPosSell();
    const newId = nextLinkId++;
    paymentLinks.unshift({id:newId, title:'POS sale', amount:subtotal, type:'onetime', collected:0, status:'active'});
    renderPaylinks(); location.hash = payHash('link', newId); return;
  }
  const cl = posClientId ? clientById(posClientId) : null;
  const method = posMethod==='Cash (POS)' ? 'Cash' : 'Card'; const mdr = gwMdr(GW_OF_METHOD[method]); const fee = Math.round(subtotal*mdr/100);
  transactions.unshift({label:'POS sale'+(cl?' — '+cl.name:''), amount:subtotal, method, time:new Date().toISOString(), pos:true, clientId: cl ? cl.id : null, mdr, fee, net: subtotal-fee});
  posStats.sales += subtotal; posStats.orders += 1;
  pushToast('Payment received', fmtMoney(subtotal)+' via '+T(posMethod)+'.');
  posOrder = []; posClientId = null; document.getElementById('pos-client-btn').textContent = '+ Add a client';
  document.getElementById('pos-discount').value = '0';
  renderPosOrder(); renderPosStats(); renderTxHistory(); persistSoon();
}
function renderTxHistory(){
  const box = document.getElementById('tx-history'); if(!box) return;
  ensureFees();
  box.innerHTML = transactions.slice(0,10).map(txRow).join('') || '<div class="empty-note">No transactions yet today.</div>';
}
function txRow(t){
  const gw = GW_OF_METHOD[t.method] || 'mixx';
  return `<div class="tx-row"><div class="tx-ic" style="background:${GW_COLOR[gw]}1f;">${t.qr?'🔳':GW_ICON[gw]}</div><div style="flex:1;min-width:0;"><div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t.label)}</div><div style="font-size:11.5px;color:var(--muted);">${fmtDateTime(t.time)} · ${T(t.method)}${t.fee?` · ${T('fee')} ${fmtMoney(t.fee)}`:''}</div></div><div style="text-align:right;"><div class="tabular" style="font-weight:800;">${fmtMoney(t.amount)}</div>${t.fee?`<div class="tabular" style="font-size:11px;color:var(--muted);">${T('net')} ${fmtMoney(t.net)}</div>`:''}</div></div>`;
}

/* ---------- periods & filters ---------- */
let dashPeriod = 'month', dashClient = 'all';
function startOfDay(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
function periodRange(p, ref){
  const now = ref || new Date(); const to = new Date(now);
  let from;
  if(p==='today') from = startOfDay(now);
  else if(p==='week'){ from = startOfDay(now); const dow = (from.getDay()+6)%7; from.setDate(from.getDate()-dow); }
  else if(p==='month') from = new Date(now.getFullYear(), now.getMonth(), 1);
  else if(p==='3m'){ from = new Date(now.getFullYear(), now.getMonth()-2, 1); }
  else if(p==='6m'){ from = new Date(now.getFullYear(), now.getMonth()-5, 1); }
  else from = new Date(2000,0,1);
  return { from, to };
}
function prevRange(p){
  const now = new Date();
  if(p==='today'){ const y = new Date(now); y.setDate(y.getDate()-1); return { from: startOfDay(y), to: y }; }
  if(p==='week'){ const r = periodRange('week'); const f = new Date(r.from); f.setDate(f.getDate()-7); const t = new Date(now); t.setDate(t.getDate()-7); return { from: f, to: t }; }
  if(p==='month'){ const f = new Date(now.getFullYear(), now.getMonth()-1, 1); const t = new Date(now); t.setMonth(t.getMonth()-1); return { from: f, to: t }; }
  return null;
}
function txIn(range, client){
  return transactions.filter(t=>{ const d = new Date(t.time); return d>=range.from && d<=range.to && (client==='all' || String(t.clientId)===String(client)); });
}
function setDashPeriod(p){ dashPeriod = p; renderDashboard(); }
function setDashClient(c){ dashClient = c; renderDashboard(); }
function resetDashFilters(){ dashPeriod = 'month'; dashClient = 'all'; renderDashboard(); }
const PERIOD_LABEL = { today:'Today', week:'This week', month:'This month', all:'All time', '3m':'Last 3 months', '6m':'Last 6 months' };
const PREV_LABEL = { today:'vs yesterday (same time)', week:'vs last week (same point)', month:'vs last month (same point)' };
function shortMoney(v){ if(v>=1e6) return (v/1e6).toFixed(v>=1e7?0:1).replace('.0','')+'M'; if(v>=1e3) return Math.round(v/1e3)+'K'; return String(Math.round(v)); }

/* ---------- dashboard ---------- */
function renderDashboard(){
  if(!document.getElementById('dash-period')) return;
  ensureFees();
  const range = periodRange(dashPeriod); const tx = txIn(range, dashClient);
  const total = tx.reduce((a,t)=>a+t.amount,0), fees = tx.reduce((a,t)=>a+(t.fee||0),0);
  document.querySelectorAll('#dash-period button').forEach(b=> b.classList.toggle('active', b.dataset.period===dashPeriod));
  const sel = document.getElementById('dash-client');
  if(dashClient!=='all' && !clients.some(c=>String(c.id)===String(dashClient))) dashClient = 'all';
  sel.innerHTML = `<option value="all">${T('All clients')}</option>` + clients.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
  sel.value = String(dashClient);
  document.getElementById('dash-reset').style.visibility = (dashPeriod!=='month' || dashClient!=='all') ? 'visible' : 'hidden';
  const clientName = dashClient==='all' ? '' : ' · ' + clientById(parseInt(dashClient,10)).name;
  document.getElementById('dash-sub').textContent = T(PERIOD_LABEL[dashPeriod]) + clientName;

  document.getElementById('dh-total').textContent = fmtMoney(total);
  document.getElementById('dh-fees').textContent = fmtMoney(fees);
  document.getElementById('dh-net').textContent = fmtMoney(total-fees);
  document.getElementById('dh-count').textContent = tx.length.toLocaleString(APP_LANG==='fr'?'fr-FR':'en-US');
  document.getElementById('dh-avg').textContent = fmtMoney(tx.length ? total/tx.length : 0);
  const pr = prevRange(dashPeriod); const dEl = document.getElementById('dh-delta');
  if(pr){
    const prev = txIn(pr, dashClient).reduce((a,t)=>a+t.amount,0);
    if(prev>0){ const pct = Math.round((total-prev)*100/prev); dEl.className = 'dh-delta ' + (pct>=0?'up':'down'); dEl.textContent = (pct>=0?'▲ +':'▼ ')+pct+'% '+T(PREV_LABEL[dashPeriod]); }
    else { dEl.className='dh-delta'; dEl.textContent = ''; }
  } else { dEl.className='dh-delta'; dEl.textContent = T('Since you joined'); }

  drawDashChart(range, tx);
  renderGwBoxes(tx, total);
  drawDonut(tx, total);
  renderDashTopClients(tx);

  const invF = invoices.filter(i=> dashClient==='all' || String(i.clientId)===String(dashClient));
  document.getElementById('kpi-active').textContent = invF.filter(i=>i.status==='active').length;
  document.getElementById('kpi-paid').textContent = invF.filter(i=>i.status==='paid' && new Date(i.date+'T12:00:00')>=range.from).length;
  document.getElementById('kpi-links').textContent = paymentLinks.filter(l=>l.status==='active').length;
  document.getElementById('kpi-clients').textContent = clients.length;
  document.getElementById('kpi-store').textContent = tx.filter(t=>/store/i.test(t.label)).length;
  document.getElementById('kpi-pos').textContent = tx.filter(t=>t.pos).length;

  const recent = invF.slice().sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,5);
  document.getElementById('recent-invoices').innerHTML = recent.map((inv,i)=>`
    <div class="list-row clickable" onclick="openInvoiceCreate(${inv.id})" style="${i<recent.length-1?'border-bottom:1px solid var(--border);':''}">
      <span class="type-icon">${typeIcon(inv)}</span>
      <div style="flex:1;font-size:13.5px;font-weight:600;min-width:0;">${esc(inv.num)} — ${esc(clientById(inv.clientId).name)}</div>
      ${statusDot(inv.status)}
      <span class="tabular" style="font-weight:700;font-size:13.5px;min-width:96px;text-align:right;">${fmtMoney(invoiceTotal(inv))}</span>
    </div>`).join('') || `<div class="empty-note">No invoices yet — create your first one with + New.</div>`;
  document.getElementById('dash-tx').innerHTML = tx.slice(0,6).map(txRow).join('') || `<div class="empty-note">${T('No transactions in this period.')}</div>`;
}

function drawDashChart(range, tx){
  const svg = document.getElementById('dash-chart'); const tip = document.getElementById('dash-tip'); tip.hidden = true;
  const W=640, H=230, pl=46, pr=12, pt=14, pb=28;
  const now = new Date(); let buckets = [], keyOf, hint;
  const loc = APP_LANG==='fr'?'fr-FR':'en-US';
  if(dashPeriod==='today'){
    for(let h=0; h<=Math.max(now.getHours(), 8); h++) buckets.push({ k:h, label: String(h).padStart(2,'0')+'h', full: String(h).padStart(2,'0')+':00', v:0 });
    keyOf = d => d.getHours(); hint = T('By hour · XOF');
  } else if(dashPeriod==='all'){
    const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const first = transactions.length ? new Date(Math.min(...transactions.map(t=>+new Date(t.time)))) : now;
    const start = new Date(first.getFullYear(), first.getMonth(), 1);
    for(let d = new Date(start); d <= now; d.setMonth(d.getMonth()+1)) buckets.push({ k: d.getFullYear()*12+d.getMonth(), label: T(MN[d.getMonth()]), full: T(MN[d.getMonth()])+' '+d.getFullYear(), v:0 });
    keyOf = d => d.getFullYear()*12+d.getMonth(); hint = T('By month · XOF');
  } else {
    for(let d = new Date(range.from); d <= now; d.setDate(d.getDate()+1)) buckets.push({ k: startOfDay(d).getTime(), label: dashPeriod==='week' ? new Intl.DateTimeFormat(loc,{weekday:'short'}).format(d) : String(d.getDate()), full: new Intl.DateTimeFormat(loc,{weekday:'short', day:'numeric', month:'short'}).format(d), v:0 });
    keyOf = d => startOfDay(d).getTime(); hint = T('By day · XOF');
  }
  document.getElementById('dc-hint').textContent = hint;
  const idx = new Map(buckets.map((b,i)=>[b.k,i]));
  tx.forEach(t=>{ const i = idx.get(keyOf(new Date(t.time))); if(i!==undefined){ buckets[i].v += t.amount; buckets[i].n = (buckets[i].n||0)+1; } });
  const max = Math.max(...buckets.map(b=>b.v), 1); const nice = niceMax(max);
  const x = i => buckets.length===1 ? (pl+W-pr)/2 : pl + i*(W-pl-pr)/(buckets.length-1);
  const y = v => pt + (1 - v/nice)*(H-pt-pb);
  let g = '';
  for(let k=0;k<=4;k++){ const v = nice*k/4, yy = y(v); g += `<line x1="${pl}" x2="${W-pr}" y1="${yy}" y2="${yy}" stroke="var(--chart-grid)" stroke-width="1"/><text x="${pl-8}" y="${yy+4}" text-anchor="end" font-size="10.5" fill="var(--muted)">${shortMoney(v)}</text>`; }
  const step = Math.ceil(buckets.length/10);
  buckets.forEach((b,i)=>{ if(i%step===0 || i===buckets.length-1) g += `<text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${b.label}</text>`; });
  const pts = buckets.map((b,i)=>[x(i), y(b.v)]);
  const line = pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const area = line + ` L${pts[pts.length-1][0].toFixed(1)},${y(0)} L${pts[0][0].toFixed(1)},${y(0)} Z`;
  const last = pts[pts.length-1];
  svg.innerHTML = `<defs><linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${GW_COLOR.mixx}" stop-opacity=".28"/><stop offset="100%" stop-color="${GW_COLOR.mixx}" stop-opacity="0"/></linearGradient></defs>
    ${g}<path d="${area}" fill="url(#dashFill)"/><path d="${line}" fill="none" stroke="${GW_COLOR.mixx}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <line id="dash-cross" x1="0" x2="0" y1="${pt}" y2="${H-pb}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>
    <circle id="dash-dot" r="4.5" fill="${GW_COLOR.mixx}" stroke="var(--surface)" stroke-width="2" opacity="0"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="4" fill="${GW_COLOR.mixx}" stroke="var(--surface)" stroke-width="2"/>
    <rect x="${pl}" y="${pt}" width="${W-pl-pr}" height="${H-pt-pb}" fill="transparent" id="dash-hit"/>`;
  const hit = document.getElementById('dash-hit'); const cross = document.getElementById('dash-cross'); const dot = document.getElementById('dash-dot');
  const wrap = document.getElementById('dash-chart-wrap');
  const move = ev => {
    const r = svg.getBoundingClientRect(); const px = (ev.touches?ev.touches[0].clientX:ev.clientX) - r.left; const vx = px * W / r.width;
    let i = buckets.length===1 ? 0 : Math.round((vx-pl)/((W-pl-pr)/(buckets.length-1))); i = Math.max(0, Math.min(buckets.length-1, i));
    const b = buckets[i]; cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', 1);
    dot.setAttribute('cx', x(i)); dot.setAttribute('cy', y(b.v)); dot.setAttribute('opacity', 1);
    tip.hidden = false; tip.innerHTML = `<div class="tt-date">${b.full}</div><div class="tt-val">${fmtMoney(b.v)}</div><div class="tt-sub">${b.n||0} ${T('transactions')}</div>`;
    const left = x(i) * r.width / W; tip.style.left = Math.min(Math.max(left, 70), r.width-70) + 'px'; tip.style.top = (y(b.v) * r.height / H) + 'px';
  };
  const leave = () => { tip.hidden = true; cross.setAttribute('opacity',0); dot.setAttribute('opacity',0); };
  hit.addEventListener('mousemove', move); hit.addEventListener('touchstart', move, {passive:true}); hit.addEventListener('mouseleave', leave);
}
function niceMax(v){ const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v/p; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p; }

function gwTotals(tx){
  const o = {}; ['mixx','bank','card','paypal','cash'].forEach(k=> o[k] = { v:0, n:0, fee:0 });
  tx.forEach(t=>{ const k = GW_OF_METHOD[t.method] || 'mixx'; o[k].v += t.amount; o[k].n++; o[k].fee += (t.fee||0); });
  return o;
}
function renderGwBoxes(tx, total){
  const o = gwTotals(tx);
  document.getElementById('dash-gw').innerHTML = ['mixx','bank','card','paypal','cash'].map(k=>{
    const share = total ? Math.round(o[k].v*100/total) : 0; const st = k==='cash' ? null : gwStatus(k);
    const target = k==='cash' ? "showView('pos-launcher')" : "showView('integration')";
    return `<div class="card gw-box clickable" onclick="${target}" tabindex="0" role="button">
      <div class="gw-box-top"><span class="gw-ico" style="background:${GW_COLOR[k]}1f;color:${GW_COLOR[k]}">${GW_ICON[k]}</span><span class="gw-box-name">${T(GW_NAME[k])}</span>${st && st.key!=='on' ? `<span class="gw-status ${st.cls}">${T(st.label)}</span>` : ''}</div>
      <div class="gw-box-val tabular">${fmtMoney(o[k].v)}</div>
      <div class="gw-box-bar"><div style="width:${share}%;background:${GW_COLOR[k]}"></div></div>
      <div class="gw-box-meta"><span>${share}% · ${o[k].n} ${T('tx')}</span><span>${k==='cash' ? T('No MDR') : T('MDR')+' '+fmtPct(gwMdr(k))+' · −'+shortMoney(o[k].fee)}</span></div>
    </div>`;
  }).join('');
}
function drawDonut(tx, total){
  const o = gwTotals(tx); const keys = ['mixx','bank','card','paypal','cash'].filter(k=>o[k].v>0);
  const svg = document.getElementById('dash-donut'); const cx=80, cy=80, R=70, r=46;
  document.getElementById('donut-total').textContent = shortMoney(total);
  if(!total){ svg.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${(R+r)/2}" fill="none" stroke="var(--surface-2)" stroke-width="${R-r}"/>`; }
  else {
    let a0 = -Math.PI/2; let paths = '';
    keys.forEach(k=>{
      const frac = o[k].v/total; const a1 = a0 + frac*2*Math.PI; const large = (a1-a0) > Math.PI ? 1 : 0;
      const p = (rad, a) => [cx + rad*Math.cos(a), cy + rad*Math.sin(a)];
      if(keys.length===1){ paths += `<circle cx="${cx}" cy="${cy}" r="${(R+r)/2}" fill="none" stroke="${GW_COLOR[k]}" stroke-width="${R-r}"/>`; }
      else { const [x0,y0]=p(R,a0),[x1,y1]=p(R,a1),[x2,y2]=p(r,a1),[x3,y3]=p(r,a0);
        paths += `<path d="M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 ${large} 0 ${x3},${y3} Z" fill="${GW_COLOR[k]}" stroke="var(--surface)" stroke-width="2"><title>${T(GW_NAME[k])}: ${fmtMoney(o[k].v)} (${Math.round(frac*100)}%)</title></path>`; }
      a0 = a1;
    });
    svg.innerHTML = paths;
  }
  document.getElementById('donut-legend').innerHTML = ['mixx','bank','card','paypal','cash'].map(k=>`<div class="dl-row clickable" onclick="${k==='cash'?"showView('pos-launcher')":"showView('integration')"}"><span class="gw-dot" style="background:${GW_COLOR[k]}"></span><span class="dl-name">${T(GW_NAME[k])}</span><span class="dl-val tabular">${fmtMoney(o[k].v)}</span><span class="dl-pct tabular">${total?Math.round(o[k].v*100/total):0}%</span></div>`).join('');
}
function renderDashTopClients(tx){
  const by = {}; tx.forEach(t=>{ if(t.clientId){ by[t.clientId] = (by[t.clientId]||0) + t.amount; } });
  const top = Object.keys(by).map(id=>({ c: clientById(parseInt(id,10)), v: by[id] })).filter(x=>x.c && x.c.name!=='—').sort((a,b)=>b.v-a.v).slice(0,5);
  const max = top.length ? top[0].v : 1;
  document.getElementById('dash-top-clients').innerHTML = top.map(x=>`<div class="tc-row clickable" onclick="openClientProfile(${x.c.id})">
    <span class="avatar avatar-sm" style="background:${avatarColor(x.c.id)};">${esc(initials(x.c.name)[0])}</span>
    <div style="flex:1;min-width:0;"><div class="tc-name">${esc(x.c.name)}</div><div class="bar-track" style="height:6px;margin-top:5px;"><div class="bar-fill" style="width:${Math.round(x.v*100/max)}%;background:${GW_COLOR.mixx}"></div></div></div>
    <span class="tabular tc-val">${fmtMoney(x.v)}</span></div>`).join('') || `<div class="empty-note">${T('No client payments in this period.')}</div>`;
}

/* ---------- reports ---------- */
function repRange(){ return periodRange(document.getElementById('rep-period').value || '6m'); }
function renderReports(){
  if(!document.getElementById('rep-period')) return;
  ensureFees();
  const p = document.getElementById('rep-period').value; const range = repRange(); const tx = txIn(range, 'all');
  const total = tx.reduce((a,t)=>a+t.amount,0), fees = tx.reduce((a,t)=>a+(t.fee||0),0);
  document.getElementById('rep-sub').textContent = T(PERIOD_LABEL[p]) + ' · ' + tx.length + ' ' + T('transactions');
  document.getElementById('rep-kpis').innerHTML = [['💰','Total collected',fmtMoney(total)],['🧾','Fees (MDR)',fmtMoney(fees)],['✅','Net received',fmtMoney(total-fees)],['🔁','Transactions',tx.length]]
    .map(k=>`<div class="card kpi"><div class="kpi-icon" style="background:var(--primary-soft);">${k[0]}</div><div><div class="kpi-label">${T(k[1])}</div><div class="kpi-value tabular">${k[2]}</div></div></div>`).join('');
  drawTrendChart(range, tx, p);
  const o = gwTotals(tx);
  document.getElementById('method-bars').innerHTML = ['mixx','bank','card','paypal','cash'].map(k=>`<div class="bar-row"><span class="name">${T(GW_NAME[k])}</span><div class="bar-track"><div class="bar-fill" style="width:${total?Math.round(o[k].v*100/total):0}%;background:${GW_COLOR[k]}"></div></div><span class="val tabular">${total?Math.round(o[k].v*100/total):0}%</span></div>`).join('');
  document.getElementById('rep-gw').innerHTML = ['mixx','bank','card','paypal','cash'].map(k=>`<tr><td><span class="gw-dot" style="background:${GW_COLOR[k]}"></span> ${T(GW_NAME[k])}</td><td class="tabular">${o[k].n}</td><td class="tabular">${fmtMoney(o[k].v)}</td><td class="tabular">${k==='cash'?'—':fmtPct(gwMdr(k))}</td><td class="tabular">${fmtMoney(o[k].fee)}</td><td class="tabular row-name">${fmtMoney(o[k].v-o[k].fee)}</td></tr>`).join('')
    + `<tr class="total-row"><td>${T('Total')}</td><td class="tabular">${tx.length}</td><td class="tabular">${fmtMoney(total)}</td><td></td><td class="tabular">${fmtMoney(fees)}</td><td class="tabular row-name">${fmtMoney(total-fees)}</td></tr>`;
  const by = {}; tx.forEach(t=>{ if(t.clientId) by[t.clientId] = (by[t.clientId]||0)+t.amount; });
  const top = Object.keys(by).map(id=>({c:clientById(parseInt(id,10)), v:by[id]})).sort((a,b)=>b.v-a.v).slice(0,5);
  document.getElementById('top-clients').innerHTML = top.map(x=>`<div class="tc-row clickable" onclick="openClientProfile(${x.c.id})"><span class="avatar avatar-sm" style="background:${avatarColor(x.c.id)};">${esc(initials(x.c.name)[0])}</span><div style="flex:1;" class="tc-name">${esc(x.c.name)}</div><span class="tabular tc-val">${fmtMoney(x.v)}</span></div>`).join('') || `<div class="empty-note">${T('No client payments in this period.')}</div>`;
}
function monthlyBuckets(range, tx, p){
  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date(); const out = [];
  if(p==='month'){
    for(let d = new Date(range.from); d <= now; d.setDate(d.getDate()+1)) out.push({ k: startOfDay(d).getTime(), label: String(d.getDate()), v:0 });
    const m = new Map(out.map((b,i)=>[b.k,i])); tx.forEach(t=>{ const i = m.get(startOfDay(new Date(t.time)).getTime()); if(i!==undefined) out[i].v += t.amount; });
    return out;
  }
  const first = p==='all' ? (transactions.length ? new Date(Math.min(...transactions.map(t=>+new Date(t.time)))) : now) : range.from;
  for(let d = new Date(first.getFullYear(), first.getMonth(), 1); d <= now; d.setMonth(d.getMonth()+1)) out.push({ k: d.getFullYear()*12+d.getMonth(), label: T(MN[d.getMonth()]), v:0 });
  const m = new Map(out.map((b,i)=>[b.k,i])); tx.forEach(t=>{ const d = new Date(t.time); const i = m.get(d.getFullYear()*12+d.getMonth()); if(i!==undefined) out[i].v += t.amount; });
  return out;
}
function drawTrendChart(range, tx, p){
  const svg = document.getElementById('trend-chart'); if(!svg) return;
  if(!range){ p = (document.getElementById('rep-period')||{}).value || '6m'; range = periodRange(p); tx = txIn(range,'all'); }
  const b = monthlyBuckets(range, tx, p);
  document.getElementById('rep-trend-hint').textContent = (p==='month' ? T('By day · XOF') : T('By month · XOF'));
  const W=640,H=220,pl=46,pr=10,pt=14,pb=28; const nice = niceMax(Math.max(...b.map(x=>x.v),1));
  const bw = (W-pl-pr)/b.length; const y = v => pt + (1-v/nice)*(H-pt-pb);
  let g=''; for(let k=0;k<=4;k++){ const v=nice*k/4; g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--chart-grid)"/><text x="${pl-8}" y="${y(v)+4}" text-anchor="end" font-size="10.5" fill="var(--muted)">${shortMoney(v)}</text>`; }
  const step = Math.ceil(b.length/12);
  b.forEach((x,i)=>{ const h = y(0)-y(x.v); const bx = pl+i*bw+Math.max(1,bw*0.18), w = Math.max(2,bw*0.64);
    g += `<path d="M${bx},${y(0)} v${-Math.max(0,h-4)} q0,-4 4,-4 h${Math.max(0,w-8)} q4,0 4,4 v${Math.max(0,h-4)} z" fill="${GW_COLOR.mixx}"><title>${x.label}: ${fmtMoney(x.v)}</title></path>`;
    if(i%step===0 || i===b.length-1) g += `<text x="${pl+i*bw+bw/2}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${x.label}</text>`; });
  svg.innerHTML = g;
}
function exportReportCsv(){
  ensureFees();
  const p = (document.getElementById('rep-period')||{}).value || '6m'; const tx = txIn(periodRange(p), 'all');
  const rows = [['Date','Time','Description','Client','Payment method','Amount (XOF)','MDR (%)','Fee (XOF)','Net (XOF)']].concat(
    tx.map(t=>{ const d = new Date(t.time); return [d.toISOString().slice(0,10), d.toTimeString().slice(0,5), t.label, t.clientId ? clientById(t.clientId).name : '', t.method, t.amount, t.mdr||0, t.fee||0, t.net!==undefined?t.net:t.amount]; }));
  const csv = '﻿' + rows.map(r=> r.map(v=> '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = 'mixx-report-' + p + '-' + new Date().toISOString().slice(0,10) + '.csv';
  document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 200);
  pushToast('Export ready', a.download + ' ' + T('was downloaded.'));
}
function pdfText(s){ return String(s).replace(/ | /g,' ').replace(/[—–]/g,'-').replace(/[’]/g,"'").replace(/[^\x20-\x7E -ÿ]/g,''); }
function exportReportPdf(){
  if(!window.jspdf){ pushToast('Export failed','PDF library not loaded.'); return; }
  ensureFees();
  const p = document.getElementById('rep-period').value; const range = periodRange(p); const tx = txIn(range,'all');
  const total = tx.reduce((a,t)=>a+t.amount,0), fees = tx.reduce((a,t)=>a+(t.fee||0),0);
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit:'pt', format:'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 40;
  const NAVY = [0,55,125], GOLD = [255,209,0], INK = [17,24,39], MUTED = [107,114,128], LINE = [227,233,243];
  const money = v => pdfText(fmtMoney(v));
  const loc = APP_LANG==='fr'?'fr-FR':'en-GB';
  // header band
  doc.setFillColor(...NAVY); doc.rect(0,0,W,86,'F');
  doc.setFillColor(...GOLD); doc.rect(0,86,W,4,'F');
  doc.setTextColor(...GOLD); doc.setFont('helvetica','bold'); doc.setFontSize(24); doc.text('Mixx', M, 44);
  doc.setTextColor(255,255,255); doc.setFontSize(8); doc.text('BUSINESS LITE', M+1, 58);
  doc.setFontSize(16); doc.text(pdfText(T('Sales report')), W-M, 40, {align:'right'});
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.text(pdfText(merchant.name + ' · ' + T(PERIOD_LABEL[p])), W-M, 58, {align:'right'});
  doc.text(pdfText(new Intl.DateTimeFormat(loc,{day:'2-digit',month:'short',year:'numeric'}).format(range.from) + ' - ' + new Intl.DateTimeFormat(loc,{day:'2-digit',month:'short',year:'numeric'}).format(range.to)), W-M, 72, {align:'right'});
  let y = 118;
  // KPI tiles
  const kpis = [['Total collected',money(total)],['Fees (MDR)',money(fees)],['Net received',money(total-fees)],['Transactions',String(tx.length)]];
  const kw = (W-2*M-3*10)/4;
  kpis.forEach((k,i)=>{ const x = M+i*(kw+10); doc.setDrawColor(...LINE); doc.setFillColor(245,248,255); doc.roundedRect(x,y,kw,54,6,6,'FD');
    doc.setTextColor(...MUTED); doc.setFontSize(8.5); doc.text(pdfText(T(k[0])).toUpperCase(), x+10, y+18);
    doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text(k[1], x+10, y+40); doc.setFont('helvetica','normal'); });
  y += 80;
  // trend bars
  const b = monthlyBuckets(range, tx, p);
  doc.setTextColor(...INK); doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(pdfText(T('Revenue trend')), M, y); doc.setFont('helvetica','normal');
  y += 12; const ch = 120, cw = W-2*M; const mx = niceMax(Math.max(...b.map(x=>x.v),1));
  doc.setDrawColor(...LINE); for(let k=0;k<=4;k++){ const yy = y+ch-(ch*k/4); doc.line(M+36,yy,M+cw,yy); doc.setFontSize(7.5); doc.setTextColor(...MUTED); doc.text(shortMoney(mx*k/4), M+30, yy+3, {align:'right'}); }
  const bw = (cw-36)/b.length; const step = Math.ceil(b.length/12);
  b.forEach((x,i)=>{ const h = ch*x.v/mx; doc.setFillColor(36,99,194); if(h>0) doc.rect(M+36+i*bw+bw*0.18, y+ch-h, Math.max(1.5,bw*0.64), h, 'F');
    if(i%step===0 || i===b.length-1){ doc.setFontSize(7.5); doc.setTextColor(...MUTED); doc.text(pdfText(x.label), M+36+i*bw+bw/2, y+ch+12, {align:'center'}); } });
  y += ch + 34;
  // gateway table
  const o = gwTotals(tx);
  doc.setTextColor(...INK); doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(pdfText(T('Payment methods & MDR')), M, y); y += 10;
  const cols = [['Payment method',0],['Transactions',150],['Collected',230],['MDR',325],['Fees',380],['Net',455]];
  const head = yy => { doc.setFillColor(...NAVY); doc.rect(M,yy,W-2*M,20,'F'); doc.setTextColor(255,255,255); doc.setFontSize(8.5); doc.setFont('helvetica','bold'); cols.forEach(c=> doc.text(pdfText(T(c[0])), M+8+c[1], yy+13)); doc.setFont('helvetica','normal'); };
  head(y); y += 20;
  ['mixx','bank','card','paypal','cash'].forEach((k,i)=>{ if(i%2){ doc.setFillColor(245,248,255); doc.rect(M,y,W-2*M,18,'F'); }
    const vals = [T(GW_NAME[k]), String(o[k].n), money(o[k].v), k==='cash'?'-':pdfText(fmtPct(gwMdr(k))), money(o[k].fee), money(o[k].v-o[k].fee)];
    doc.setTextColor(...INK); doc.setFontSize(9); cols.forEach((c,j)=> doc.text(pdfText(vals[j]), M+8+c[1], y+12)); y += 18; });
  doc.setFont('helvetica','bold'); doc.setDrawColor(...NAVY); doc.line(M,y,W-M,y);
  [T('Total'), String(tx.length), money(total), '', money(fees), money(total-fees)].forEach((v,j)=> doc.text(pdfText(v), M+8+cols[j][1], y+13)); doc.setFont('helvetica','normal');
  y += 36;
  // transactions
  doc.setTextColor(...INK); doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(pdfText(T('Transactions')), M, y); doc.setFont('helvetica','normal'); y += 10;
  const tcols = [['Date',0],['Description',78],['Client',228],['Payment method',318],['Amount',400],['Fee',470]];
  const thead = yy => { doc.setFillColor(...NAVY); doc.rect(M,yy,W-2*M,20,'F'); doc.setTextColor(255,255,255); doc.setFontSize(8.5); doc.setFont('helvetica','bold'); tcols.forEach(c=> doc.text(pdfText(T(c[0])), M+8+c[1], yy+13)); doc.setFont('helvetica','normal'); };
  thead(y); y += 20;
  const list = tx.slice(0, 300);
  list.forEach((t,i)=>{
    if(y > H-60){ doc.addPage(); y = M; thead(y); y += 20; }
    if(i%2){ doc.setFillColor(245,248,255); doc.rect(M,y,W-2*M,16,'F'); }
    const d = new Date(t.time); doc.setTextColor(...INK); doc.setFontSize(8);
    const cl = t.clientId ? clientById(t.clientId).name : '-';
    [new Intl.DateTimeFormat(loc,{day:'2-digit',month:'short'}).format(d)+' '+d.toTimeString().slice(0,5), t.label.slice(0,30), cl.slice(0,18), T(t.method), money(t.amount), money(t.fee||0)]
      .forEach((v,j)=> doc.text(pdfText(v), M+8+tcols[j][1], y+11));
    y += 16;
  });
  if(tx.length > list.length){ y += 12; doc.setTextColor(...MUTED); doc.setFontSize(8.5); doc.text(pdfText(T('Showing the latest 300 transactions. Export CSV for the full list.')), M, y); }
  // footer on every page
  const pages = doc.getNumberOfPages();
  for(let i=1;i<=pages;i++){ doc.setPage(i); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(pdfText('Mixx Business Lite · ' + T('Generated') + ' ' + new Intl.DateTimeFormat(loc,{dateStyle:'medium', timeStyle:'short'}).format(new Date())), M, H-24);
    doc.text(i + ' / ' + pages, W-M, H-24, {align:'right'}); }
  const name = 'mixx-report-' + p + '-' + new Date().toISOString().slice(0,10) + '.pdf';
  doc.save(name);
  pushToast('Export ready', name + ' ' + T('was downloaded.'));
}

/* ---------- navigation helpers ---------- */
let prevView = 'dashboard', curView = 'dashboard';
const _showViewV4 = showView;
showView = function(name){
  if(name !== curView){ prevView = curView; curView = name; }
  _showViewV4(name);
  if(name==='integration'){ renderMethods(); }
  if(name==='reports'){ renderReports(); }
  if(name==='dashboard'){ renderDashboard(); }
};
function goBackFromProduct(){ showView(prevView==='store' ? 'store' : 'products'); }

/* ---------- account refresh (admin may change MDR / locks) ---------- */
const _setMerchantV4 = setMerchantFromAccount;
setMerchantFromAccount = function(acc){ _setMerchantV4(acc); };
const _loadStateV4 = loadState;
loadState = function(s){ if(s && typeof Store.upgradeState==='function') Store.upgradeState(s, account); _loadStateV4(s); };

/* ---------- persistence wrappers for replaced render functions ---------- */
['renderDashboard','renderMethods','renderTxHistory'].forEach(name=>{
  const fn = window[name];
  window[name] = function(){ const r = fn.apply(this, arguments); persistSoon(); return r; };
});
const _renderAllV4 = renderAll;
renderAll = function(){ if(!loadedOwner) return; ensureFees(); _renderAllV4(); renderIcMethods(); if(curView==='reports') renderReports(); };

/* =====================================================================
   Admin (v5): revenue from real transactions + gateway controls
   ===================================================================== */
function merchantStats(state){
  if(!state) return { revenue:0, invoices:0, paid:0, clients:0, products:0, links:0, fees:0 };
  const tx = state.transactions || [];
  return {
    revenue: tx.reduce((s,t)=>s+t.amount,0), fees: tx.reduce((s,t)=>s+(t.fee||0),0),
    invoices: (state.invoices||[]).length, paid: (state.invoices||[]).filter(i=>i.status==='paid').length,
    clients: (state.clients||[]).length, products: (state.products||[]).length, links: (state.paymentLinks||[]).length,
  };
}
let adminPlatform = null;
const _showAdminV4 = showAdmin;
showAdmin = async function(hash){
  adminPlatform = await Store.getPlatform();
  if((hash||'') === '#admin/gateways'){ document.getElementById('admin-shell').classList.add('active'); await loadAdminData(); adminView('gateways', true); return; }
  return _showAdminV4(hash);
};
const _renderAdminV4 = renderAdmin;
renderAdmin = function(){
  if(!document.getElementById('admin-shell').classList.contains('active')) return;
  if(adminCurrent==='gateways') return renderAdminGateways();
  _renderAdminV4();
  if(adminCurrent==='merchant') renderAdminMerchantGateways();
};
function renderAdminGateways(){
  const p = adminPlatform || Store.getPlatformSync();
  document.getElementById('ag-tbody').innerHTML = GW_IDS.map(id=>{
    const using = adminAccounts.filter(a=>{ const s = adminData[a.id]; return s && (s.payMethods||[]).some(m=>m.id===id && m.active) && !(a.gatewayLocks||{})[id]; }).length;
    const special = adminAccounts.filter(a=> a.mdr && a.mdr[id]!==undefined && a.mdr[id]!=='' && a.mdr[id]!==null).length;
    return `<tr><td><span class="gw-dot" style="background:${GW_COLOR[id]}"></span> <strong>${T(GW_NAME[id])}</strong></td>
      <td><input class="mdr-input" type="number" min="0" max="10" step="0.1" id="ag-mdr-${id}" value="${p.gateways[id].mdr}"/> %</td>
      <td><button class="toggle ${p.gateways[id].enabled?'on':''}" id="ag-on-${id}" onclick="toggleBtn(this)" aria-label="${T(GW_NAME[id])}"></button></td>
      <td class="tabular">${using} / ${adminAccounts.length}</td><td class="tabular">${special}</td></tr>`;
  }).join('');
}
async function adminSaveGateways(){
  const p = await Store.getPlatform(); let bad = false;
  GW_IDS.forEach(id=>{ const el = document.getElementById('ag-mdr-'+id); const v = parseFloat(el.value);
    if(isNaN(v) || v<0 || v>10){ el.classList.add('invalid'); bad = true; return; } el.classList.remove('invalid');
    p.gateways[id].mdr = Math.round(v*100)/100; p.gateways[id].enabled = document.getElementById('ag-on-'+id).classList.contains('on'); });
  if(bad){ pushToast('Check the form','MDR must be between 0 and 10%.'); return; }
  await Store.savePlatform(p); adminPlatform = p; await loadAdminData(); renderAdminGateways();
  pushToast('Settings saved','Payment methods and MDR updated for all merchants.');
}
function renderAdminMerchantGateways(){
  const a = adminAccounts.find(x=>x.id===adminSelected); const box = document.getElementById('am-gw'); if(!a || !box) return;
  const p = adminPlatform || Store.getPlatformSync(); const s = adminData[a.id] || {};
  box.innerHTML = GW_IDS.map(id=>{
    const on = (s.payMethods||[]).some(m=>m.id===id && m.active); const locked = !!(a.gatewayLocks||{})[id];
    const ov = (a.mdr||{})[id]; const platformOff = !p.gateways[id].enabled;
    return `<tr><td><span class="gw-dot" style="background:${GW_COLOR[id]}"></span> <strong>${T(GW_NAME[id])}</strong>${platformOff?` <small class="gw-status st-off">${T('Off for all merchants')}</small>`:''}</td>
      <td>${on ? `<span class="pill" style="background:var(--green-soft);color:var(--green);">${T('On')}</span>` : `<span class="pill" style="background:var(--surface-2);color:var(--ink-soft);">${T('Off')}</span>`}</td>
      <td><input class="mdr-input" type="number" min="0" max="10" step="0.1" id="am-mdr-${id}" value="${ov!==undefined&&ov!==null?ov:''}" placeholder="${p.gateways[id].mdr}"/> %</td>
      <td><div class="seg lock-seg" data-gw="${id}"><button class="${locked?'':'active'}" onclick="setLockSeg('${id}', false)">${T('Allowed')}</button><button class="${locked?'active danger':''}" onclick="setLockSeg('${id}', true)">${T('Blocked')}</button></div></td></tr>`;
  }).join('');
}
function setLockSeg(id, locked){ const seg = document.querySelector(`.lock-seg[data-gw="${id}"]`); const [a,b] = seg.querySelectorAll('button'); a.classList.toggle('active', !locked); b.classList.toggle('active', locked); b.classList.toggle('danger', locked); }
async function adminSaveMerchantGateways(){
  const a = adminAccounts.find(x=>x.id===adminSelected); if(!a) return;
  const mdr = {}, locks = {}; let bad = false;
  GW_IDS.forEach(id=>{ const el = document.getElementById('am-mdr-'+id); const raw = el.value.trim();
    if(raw!==''){ const v = parseFloat(raw); if(isNaN(v)||v<0||v>10){ el.classList.add('invalid'); bad = true; return; } el.classList.remove('invalid'); mdr[id] = Math.round(v*100)/100; }
    if(document.querySelector(`.lock-seg[data-gw="${id}"] button.danger`)) locks[id] = true; });
  if(bad){ pushToast('Check the form','MDR must be between 0 and 10%.'); return; }
  await Store.updateAccount(a.id, { mdr, gatewayLocks: locks }); await loadAdminData(); renderAdmin();
  pushToast('Settings saved', a.business);
}
const _adminViewV4 = adminView;
adminView = function(v, noHash){
  if(v==='gateways'){
    adminCurrent = v; closeSidebar();
    document.querySelectorAll('#admin-shell .view').forEach(el=> el.classList.toggle('active', el.id==='aview-gateways'));
    document.querySelectorAll('#admin-sidebar .nav-item[data-aview]').forEach(n=> n.classList.toggle('active', n.dataset.aview==='gateways'));
    if(!noHash && location.hash!=='#admin/gateways') history.replaceState(null,'','#admin/gateways');
    renderAdminGateways(); window.scrollTo({top:0, behavior:'instant'}); return;
  }
  return _adminViewV4(v, noHash);
};
