/* =====================================================================
   Mixx Business Lite — Admin panel (v4)
   Uses only window.Store, so it works unchanged when Store moves to Supabase.
   ===================================================================== */
let adminAccounts = [], adminData = {}, adminCurrent = 'overview', adminSelected = null;
const COUNTRY_NAMES = { SN:'Senegal', TG:'Togo', TZ:'Tanzania' };
const PLAN_NAMES = { free:'Free', pro:'Professional', enterprise:'Enterprise' };

function merchantStats(state){
  if(!state) return { revenue:0, invoices:0, paid:0, clients:0, products:0, links:0 };
  const live = (state.transactions||[]).filter(t=>!t.seed).reduce((s,t)=>s+t.amount,0);
  const kb = state.kpiBase || {revenue:0, paid:0, clients:0};
  return {
    revenue: (kb.revenue||0) + live,
    invoices: (state.invoices||[]).length,
    paid: (state.invoices||[]).filter(i=>i.status==='paid').length,
    clients: (state.clients||[]).length,
    products: (state.products||[]).length,
    links: (state.paymentLinks||[]).length,
  };
}
function fmtDay(iso){ if(!iso) return '—'; const d = new Date(iso); return new Intl.DateTimeFormat(APP_LANG==='fr'?'fr-FR':'en-GB', {day:'2-digit', month:'short', year:'numeric'}).format(d); }
function statusPill(st){ return st==='active' ? '<span class="pill" style="background:var(--green-soft);color:var(--green);">Active</span>' : '<span class="pill" style="background:#FEE2E2;color:var(--red);">Disabled</span>'; }

async function loadAdminData(){
  adminAccounts = (await Store.listAccounts()).filter(a=>a.role!=='admin');
  adminData = await Store.allData();
}
async function showAdmin(hash){
  document.getElementById('admin-shell').classList.add('active');
  document.title = T('Platform overview') + ' — Mixx Business Lite';
  await loadAdminData();
  const m = (hash||'').match(/^#admin\/merchant\/([\w-]+)$/);
  if(m && adminAccounts.some(a=>a.id===m[1])){ adminSelected = m[1]; adminView('merchant', true); }
  else adminView(['overview','accounts','data'].includes((hash||'').split('/')[1]) ? hash.split('/')[1] : 'overview', true);
}
function adminView(v, noHash){
  adminCurrent = v; closeSidebar();
  document.querySelectorAll('#admin-shell .view').forEach(el=> el.classList.toggle('active', el.id==='aview-'+v));
  document.querySelectorAll('#admin-sidebar .nav-item[data-aview]').forEach(n=> n.classList.toggle('active', n.dataset.aview===(v==='merchant'?'accounts':v)));
  const h = v==='merchant' ? '#admin/merchant/'+adminSelected : (v==='overview' ? '#admin' : '#admin/'+v);
  if(!noHash && location.hash!==h) history.replaceState(null,'',h);
  renderAdmin(); window.scrollTo({top:0, behavior:'instant'});
}
function renderAdmin(){
  if(!document.getElementById('admin-shell').classList.contains('active')) return;
  if(adminCurrent==='overview') renderAdminOverview();
  if(adminCurrent==='accounts') renderAdminAccounts();
  if(adminCurrent==='merchant') renderAdminMerchant();
  if(adminCurrent==='data') renderAdminData();
}

/* ---------- overview ---------- */
function barRows(counts, total){
  return Object.keys(counts).map((k,i)=>`<div class="bar-row"><span class="name">${T(k)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(counts[k]*100/(total||1))}%;background:var(${['--series-1','--series-2','--series-4'][i%3]})"></div></div><span class="val tabular">${counts[k]}</span></div>`).join('') || '<div class="empty-note">No accounts yet.</div>';
}
function renderAdminOverview(){
  const stats = adminAccounts.map(a=>({ a, s: merchantStats(adminData[a.id]) }));
  document.getElementById('ak-merchants').textContent = adminAccounts.length;
  document.getElementById('ak-active').textContent = adminAccounts.filter(a=>a.status==='active').length;
  document.getElementById('ak-revenue').textContent = fmtMoney(stats.reduce((t,x)=>t+x.s.revenue,0));
  document.getElementById('ak-invoices').textContent = stats.reduce((t,x)=>t+x.s.invoices,0);
  const plans = {}; adminAccounts.forEach(a=>{ const k = PLAN_NAMES[a.plan]||a.plan; plans[k]=(plans[k]||0)+1; });
  const countries = {}; adminAccounts.forEach(a=>{ const k = COUNTRY_NAMES[a.country]||a.country||'—'; countries[k]=(countries[k]||0)+1; });
  document.getElementById('ak-plans').innerHTML = barRows(plans, adminAccounts.length);
  document.getElementById('ak-countries').innerHTML = barRows(countries, adminAccounts.length);
  document.getElementById('ak-top').innerHTML = stats.sort((x,y)=>y.s.revenue-x.s.revenue).slice(0,8).map(({a,s})=>`<tr>
    <td><div class="row-name">${esc(a.business)}</div><div class="row-sub">${esc(a.owner)}</div></td>
    <td>${T(COUNTRY_NAMES[a.country]||'—')}</td><td>${T(PLAN_NAMES[a.plan]||a.plan)}</td>
    <td class="tabular row-name">${fmtMoney(s.revenue)}</td><td class="tabular">${s.invoices}</td><td class="tabular">${s.clients}</td>
    <td><button class="btn btn-ghost btn-sm" onclick="openAdminMerchant('${a.id}')">View</button></td></tr>`).join('') || `<tr><td colspan="7"><div class="empty-note">No accounts yet.</div></td></tr>`;
}

/* ---------- accounts ---------- */
function renderAdminAccounts(){
  const q = (document.getElementById('aa-search').value||'').toLowerCase().trim();
  const st = document.getElementById('aa-status').value;
  const list = adminAccounts.filter(a=> (st==='all' || a.status===st) && (!q || [a.business,a.owner,a.username,a.email].join(' ').toLowerCase().includes(q)))
    .sort((x,y)=> new Date(y.createdAt)-new Date(x.createdAt));
  document.getElementById('aa-tbody').innerHTML = list.map(a=>`<tr>
    <td><div class="row-name">${esc(a.business)}</div><div class="row-sub">${esc(a.owner)}</div></td>
    <td class="mono">${esc(a.username)}</td><td>${esc(a.email)}</td><td>${T(COUNTRY_NAMES[a.country]||'—')}</td>
    <td><select class="plan-select" onchange="adminSetPlan('${a.id}', this.value)">${['free','pro','enterprise'].map(p=>`<option value="${p}" ${a.plan===p?'selected':''}>${T(PLAN_NAMES[p])}</option>`).join('')}</select></td>
    <td>${statusPill(a.status)}</td><td class="tabular">${fmtDay(a.createdAt)}</td><td class="tabular">${fmtDay(a.lastLogin)}</td>
    <td><div class="row-actions">
      <button class="btn btn-ghost btn-sm" onclick="openAdminMerchant('${a.id}')">View</button>
      <button class="btn btn-ghost btn-sm" onclick="adminToggleStatus('${a.id}')">${a.status==='active'?'Disable':'Enable'}</button>
      <button class="btn btn-ghost btn-sm" onclick="adminResetPassword('${a.id}')">Reset password</button>
      <button class="btn btn-ghost btn-sm danger-text" onclick="adminConfirm('delete','${a.id}')">Delete</button>
    </div></td></tr>`).join('') || `<tr><td colspan="9"><div class="empty-note">No accounts match.</div></td></tr>`;
}
async function adminSetPlan(id, plan){
  await Store.updateAccount(id, {plan}); await loadAdminData(); renderAdmin();
  pushToast('Plan updated', 'Plan changed to '+PLAN_NAMES[plan]+'.');
}
async function adminToggleStatus(id){
  const a = adminAccounts.find(x=>x.id===id); const status = a.status==='active' ? 'disabled' : 'active';
  await Store.updateAccount(id, {status}); await loadAdminData(); renderAdmin();
  pushToast(status==='active' ? 'Account enabled' : 'Account disabled', a.business);
}
let resetFor = null;
function genPassword(){ const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<10;i++) s += c[Math.floor(Math.random()*c.length)]; return s; }
function adminResetPassword(id){
  resetFor = id; const a = adminAccounts.find(x=>x.id===id);
  document.getElementById('ap-for').textContent = T('New password for '+a.business+' ('+a.username+').');
  const inp = document.getElementById('ap-pass'); inp.value = genPassword(); fieldError(inp, false);
  openOverlay('admin-pass-overlay');
}
async function adminSavePassword(){
  const inp = document.getElementById('ap-pass');
  if(!fieldError(inp, inp.value.length<6)) return;
  await Store.setPassword(resetFor, inp.value);
  copyText(inp.value);
  closeOverlay('admin-pass-overlay');
  pushToast('Password reset', 'New password copied — share it with the merchant.');
}
function openAdminMerchant(id){ adminSelected = id; adminView('merchant'); }

/* ---------- merchant detail (read-only) ---------- */
function renderAdminMerchant(){
  const a = adminAccounts.find(x=>x.id===adminSelected); if(!a){ adminView('accounts'); return; }
  const s = adminData[a.id] || Store.emptyState(a); const st = merchantStats(s);
  const cById = id => (s.clients||[]).find(c=>c.id===id) || {name:'—'};
  document.getElementById('am-title').textContent = a.business;
  document.getElementById('am-sub').textContent = a.owner + ' · ' + a.username + ' · ' + T(COUNTRY_NAMES[a.country]||'');
  document.getElementById('am-actions').innerHTML = `${statusPill(a.status)}
    <button class="btn btn-ghost btn-sm" onclick="adminToggleStatus('${a.id}')">${a.status==='active'?'Disable':'Enable'}</button>
    <button class="btn btn-ghost btn-sm" onclick="adminResetPassword('${a.id}')">Reset password</button>`;
  document.getElementById('am-kpis').innerHTML = [
    ['💰','Total revenue', fmtMoney(st.revenue)], ['🧾','Invoices', st.invoices], ['✅','Paid invoices', st.paid], ['👥','Clients', st.clients]
  ].map(k=>`<div class="card kpi"><div class="kpi-icon" style="background:var(--primary-soft);">${k[0]}</div><div><div class="kpi-label">${k[1]}</div><div class="kpi-value tabular">${k[2]}</div></div></div>`).join('');
  document.getElementById('am-invoices').innerHTML = (s.invoices||[]).slice().sort((x,y)=>new Date(y.date)-new Date(x.date)).map(inv=>`<tr><td class="row-name">${esc(inv.num)}</td><td>${esc(cById(inv.clientId).name)}</td><td class="tabular">${fmtDate(inv.date)}</td><td class="tabular">${fmtMoney(invoiceTotal(inv))}</td><td>${statusDot(inv.status)}</td></tr>`).join('') || `<tr><td colspan="5"><div class="empty-note">No invoices yet.</div></td></tr>`;
  const po = s.payout || {};
  document.getElementById('am-profile').innerHTML = [
    ['Username', a.username], ['E-mail', a.email], ['Mixx number', a.phone], ['City', a.city], ['Plan', T(PLAN_NAMES[a.plan])],
    ['Joined', fmtDay(a.createdAt)], ['Last login', fmtDay(a.lastLogin)], ['Payout account', (po.bank||'—') + (po.iban ? ' · ' + po.iban.slice(0,4) + ' •••• ' + po.iban.slice(-4) : '')]
  ].map(r=>`<div class="kv"><span>${T(r[0])}</span><strong>${esc(r[1]||'—')}</strong></div>`).join('');
  document.getElementById('am-clients').innerHTML = (s.clients||[]).map(c=>`<tr><td class="row-name">${esc(c.name)}</td><td>${esc(c.phone||'–')}</td><td>${esc(c.email||'–')}</td></tr>`).join('') || `<tr><td colspan="3"><div class="empty-note">No clients yet.</div></td></tr>`;
  document.getElementById('am-products').innerHTML = (s.products||[]).map(p=>`<tr><td class="row-name">${esc(p.name)}</td><td class="tabular">${p.qty}</td><td class="tabular">${fmtMoney(p.price).replace(' XOF','')}</td><td>${p.published?'✓':'—'}</td></tr>`).join('') || `<tr><td colspan="4"><div class="empty-note">No products yet.</div></td></tr>`;
  document.getElementById('am-links').innerHTML = (s.paymentLinks||[]).map(l=>`<tr><td class="row-name">${esc(l.title)}</td><td class="tabular">${l.type==='reusable'?T('Any amount'):fmtMoney(l.amount)}</td><td class="tabular">${fmtMoney(l.collected)}</td></tr>`).join('') || `<tr><td colspan="3"><div class="empty-note">No payment links yet.</div></td></tr>`;
  document.getElementById('am-tx').innerHTML = (s.transactions||[]).slice(0,8).map(t=>`<div class="tx-row"><div class="tx-ic">${t.pos?'🧾':'💳'}</div><div style="flex:1;"><div style="font-weight:700;">${esc(t.label)}</div><div style="font-size:11.5px;color:var(--muted);">${fmtDateTime(t.time)} · ${T(t.method)}</div></div><div class="tabular" style="font-weight:800;">${fmtMoney(t.amount)}</div></div>`).join('') || '<div class="empty-note">No transactions yet.</div>';
}

/* ---------- data & settings ---------- */
function renderAdminData(){
  let used = 0; try { used = (localStorage.getItem('mbl_db_v4')||'').length * 2; } catch(e){}
  const cap = 5 * 1024 * 1024, pct = Math.min(100, Math.round(used*100/cap));
  document.getElementById('storage-bar').style.width = Math.max(2,pct) + '%';
  document.getElementById('storage-text').textContent = T((used/1024).toFixed(0)+' KB used of about 5 MB ('+pct+'%)');
  ['ad-cur','ad-new','ad-new2'].forEach(id=>{ const el = document.getElementById(id); el.value=''; fieldError(el,false); });
}
function adminChangePassword(){
  const sess = currentSession(); if(!sess) return;
  const cur = document.getElementById('ad-cur'), n1 = document.getElementById('ad-new'), n2 = document.getElementById('ad-new2');
  const ok = [fieldError(cur, !cur.value), fieldError(n1, n1.value.length<6), fieldError(n2, n2.value!==n1.value || !n2.value)].every(Boolean);
  if(!ok) return;
  Store.changePassword(sess.uid, cur.value, n1.value).then(()=>{ [cur,n1,n2].forEach(e=>e.value=''); pushToast('Password changed','Use your new password next time you log in.'); })
    .catch(e=> fieldError(cur, true, e.code==='wrong_password' ? 'Current password is incorrect.' : 'Something went wrong.'));
}
function downloadBlob(blob, name){
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 300);
}
async function adminBackup(){
  const db = await Store.exportAll();
  downloadBlob(new Blob([JSON.stringify(db, null, 1)], {type:'application/json'}), 'mixx-business-lite-backup-' + new Date().toISOString().slice(0,10) + '.json');
  pushToast('Backup downloaded','Keep this file safe — it contains every account.');
}
function adminRestore(input){
  const f = input.files && input.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = () => {
    let obj; try { obj = JSON.parse(r.result); } catch(e){ pushToast('Restore failed','This is not a valid backup file.'); input.value=''; return; }
    adminConfirm('restore', null, obj); input.value='';
  };
  r.readAsText(f);
}
async function adminExportExcel(){
  if(typeof XLSX==='undefined'){ pushToast('Export failed','Excel library not loaded.'); return; }
  await loadAdminData();
  const byId = {}; adminAccounts.forEach(a=> byId[a.id]=a);
  const acc = adminAccounts.map(a=>{ const s = merchantStats(adminData[a.id]); return { Business:a.business, Owner:a.owner, Username:a.username, Email:a.email, Phone:a.phone, City:a.city, Country:COUNTRY_NAMES[a.country]||a.country, Plan:PLAN_NAMES[a.plan]||a.plan, Status:a.status, Joined:(a.createdAt||'').slice(0,10), 'Last login':(a.lastLogin||'').slice(0,10), 'Collected (XOF)':s.revenue, Invoices:s.invoices, Clients:s.clients, Products:s.products }; });
  const inv=[], cli=[], prod=[], links=[], tx=[];
  adminAccounts.forEach(a=>{
    const s = adminData[a.id]; if(!s) return; const cName = id => ((s.clients||[]).find(c=>c.id===id)||{}).name || '';
    (s.invoices||[]).forEach(i=> inv.push({ Business:a.business, Invoice:i.num, Client:cName(i.clientId), Date:i.date, Type:i.type, 'Amount (XOF)':invoiceTotal(i), Status:i.status }));
    (s.clients||[]).forEach(c=> cli.push({ Business:a.business, Client:c.name, Phone:c.phone, Email:c.email }));
    (s.products||[]).forEach(p=> prod.push({ Business:a.business, Product:p.name, SKU:p.sku||'', 'Price (XOF)':p.price, Quantity:p.qty, Published:p.published?'yes':'no' }));
    (s.paymentLinks||[]).forEach(l=> links.push({ Business:a.business, Title:l.title, Type:l.type, 'Amount (XOF)':l.amount, 'Collected (XOF)':l.collected, Status:l.status }));
    (s.transactions||[]).forEach(t=> tx.push({ Business:a.business, Label:t.label, Method:t.method, 'Amount (XOF)':t.amount, Time:String(t.time).replace('T',' ').slice(0,16) }));
  });
  const wb = XLSX.utils.book_new();
  [['Accounts',acc],['Invoices',inv],['Clients',cli],['Products',prod],['Payment links',links],['Transactions',tx]].forEach(([n,rows])=>{
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info:'No data' }]);
    const keys = Object.keys(rows[0] || {Info:''});
    ws['!cols'] = keys.map(k=>({ wch: Math.min(40, Math.max(k.length, ...rows.map(r=>String(r[k]==null?'':r[k]).length)) + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, n);
  });
  const out = XLSX.write(wb, {bookType:'xlsx', type:'array'});
  downloadBlob(new Blob([out], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), 'mixx-business-lite-' + new Date().toISOString().slice(0,10) + '.xlsx');
  pushToast('Export ready','Excel file with all merchants was downloaded.');
}

/* ---------- confirm dialog ---------- */
function adminConfirm(kind, id, payload){
  const t = document.getElementById('ac-title'), b = document.getElementById('ac-body'), ok = document.getElementById('ac-ok');
  if(kind==='delete'){
    const a = adminAccounts.find(x=>x.id===id);
    t.textContent = T('Delete account?'); b.textContent = T('This permanently deletes '+a.business+' and all of its data.'); ok.textContent = T('Delete');
    ok.onclick = async ()=>{ await Store.deleteAccount(id); closeOverlay('admin-confirm-overlay'); await loadAdminData(); if(adminCurrent==='merchant') adminView('accounts'); else renderAdmin(); pushToast('Account deleted', a.business); };
  } else if(kind==='reset'){
    t.textContent = T('Reset everything?'); b.textContent = T('All accounts and data in this browser will be replaced by the original demo accounts. Download a backup first if you need it.'); ok.textContent = T('Reset everything');
    ok.onclick = async ()=>{ await Store.resetAll(); closeOverlay('admin-confirm-overlay'); Store.session.clear(); location.hash = '#login'; pushToast('Demo data restored','Log in again with the demo accounts.'); };
  } else if(kind==='restore'){
    t.textContent = T('Restore this backup?'); b.textContent = T('All accounts and data in this browser will be replaced by the backup file.'); ok.textContent = T('Restore');
    ok.onclick = async ()=>{ try { await Store.importAll(payload); closeOverlay('admin-confirm-overlay'); Store.session.clear(); location.hash = '#login'; pushToast('Backup restored','Log in again with an account from the backup.'); }
      catch(e){ closeOverlay('admin-confirm-overlay'); pushToast('Restore failed','This is not a valid backup file.'); } };
  }
  ok.textContent = T(ok.textContent);
  openOverlay('admin-confirm-overlay');
}
