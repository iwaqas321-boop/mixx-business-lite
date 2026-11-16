/* Mixx Business Lite — merchant dashboard (v4). Accounts + data via store.js. */
const TODAY = new Date('2026-09-11T00:00:00');
function isoDate(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function fmtMoney(n){ return new Intl.NumberFormat(APP_LANG==='fr'?'fr-FR':'en-US').format(Math.round(n)).replace(/\u202f|\u00a0/g,' ') + ' XOF'; }
function fmtDate(iso){ const d = new Date(iso+'T00:00:00'); const dd=String(d.getDate()).padStart(2,'0'), mm=String(d.getMonth()+1).padStart(2,'0'); return `${dd}/${mm}/${d.getFullYear()}`; }
function fmtDateTime(d){ d = new Date(d); return new Intl.DateTimeFormat(APP_LANG==='fr'?'fr-FR':'en-US', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}).format(d); }
function initials(name){ return name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase(); }

const AVATAR_COLORS = ['--avatar-1','--avatar-2','--avatar-3','--avatar-4'];
function avatarColor(id){ return `var(${AVATAR_COLORS[(id-1)%AVATAR_COLORS.length]})`; }

/* Data for the signed-in merchant (or guest). Filled by loadState() from Store — see app/store.js */
let clients = [], products = [], invoices = [], paymentLinks = [], transactions = [];
let nextInvoiceId = 1, nextLinkId = 1;
let kpiBase = { revenue:0, active:0, paid:0, clients:0 }, trendBase = [0,0,0,0,0,0], methodBase = {};
function clientById(id){ return clients.find(c=>c.id===id) || {id, name:'—', phone:'', email:''}; }
function clientInvoiceCount(id){ return invoices.filter(i=>i.clientId===id).length; }
function invoiceTotal(inv){ return inv.items.reduce((s,i)=>s+i.price*i.qty,0); }
function nextInvoiceNum(){
  const nums = invoices.map(i=>parseInt(String(i.num).replace(/\D/g,''),10)).filter(n=>!isNaN(n));
  return '#' + (nums.length ? Math.max(...nums)+1 : 1001);
}
function liveTx(){ return transactions.filter(t=>!t.seed); }

function statusDot(status){
  const labels = {active:'Active', paid:'Paid', draft:'Draft'};
  return `<span class="status-dot ${status}">${labels[status]}</span>`;
}
function typeIcon(inv){
  if(inv.status==='paid') return '✅';
  return inv.type==='express' ? '⚡' : '📋';
}
function clientChip(id){
  const c = clientById(id);
  return `<span class="client-chip" onclick="openClientProfile(${id})"><span class="avatar avatar-sm" style="background:${avatarColor(id)};">${initials(c.name)[0]}</span>${c.name} <span style="color:var(--muted);">⌄</span></span>`;
}

function showView(name){
  closeSidebar();
  if(name==='settings') fillSettings();
  if(name==='pos-launcher') renderTxHistory();
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===name));
  window.scrollTo({top:0, behavior:'instant'});
}
function toggleBtn(el){ el.classList.toggle('on'); }
function toggleCheck(row){ const box = row.querySelector('.checkbox-sq'); const on = box.classList.toggle('checked'); box.textContent = on ? '✓' : ''; }
function toggleNewMenu(){ document.getElementById('new-dropdown').classList.toggle('open'); document.getElementById('user-dropdown').classList.remove('open'); }
function closeNewMenu(){ document.getElementById('new-dropdown').classList.remove('open'); }
function toggleUserMenu(){ document.getElementById('user-dropdown').classList.toggle('open'); document.getElementById('new-dropdown').classList.remove('open'); }
function closeUserMenu(){ document.getElementById('user-dropdown').classList.remove('open'); }
document.addEventListener('click', function(e){
  if(!e.target.closest('.new-menu-wrap')) closeNewMenu();
  if(!e.target.closest('.user-menu-wrap')) closeUserMenu();
  if(!e.target.closest('.notif-wrap')) closeNotif();
  if(!e.target.closest('.filter-wrap')) closeFilterPanel();
  if(!e.target.closest('.sidebar') && !e.target.closest('.menu-btn')) closeSidebar();
});
/* Safety net: clicking the dark backdrop, or pressing Escape, always closes whichever modal is open. */
document.addEventListener('click', function(e){
  if(e.target.classList && e.target.classList.contains('modal-overlay') && e.target.classList.contains('open')){
    e.target.classList.remove('open');
  }
});
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(el => el.classList.remove('open'));
  }
});

/* Login / logout: see the v3 auth section at the bottom of this file. */

/* ---------------- Dashboard ---------------- */
function renderDashboard(){
  const revenue = kpiBase.revenue + liveTx().reduce((s,t)=>s+t.amount,0);
  document.getElementById('kpi-revenue').textContent = fmtMoney(revenue);
  document.getElementById('kpi-active').textContent = invoices.filter(i=>i.status==='active').length + paymentLinks.filter(l=>l.status==='active').length + kpiBase.active;
  document.getElementById('kpi-paid').textContent = invoices.filter(i=>i.status==='paid').length + kpiBase.paid;
  document.getElementById('kpi-clients').textContent = clients.length + kpiBase.clients;
  const recent = [...invoices].sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,4);
  document.getElementById('recent-invoices').innerHTML = recent.map((inv,i)=>`
    <div style="display:flex;align-items:center;gap:12px;padding:11px 0;${i<recent.length-1?'border-bottom:1px solid var(--border);':''}">
      <span class="type-icon">${typeIcon(inv)}</span>
      <div style="flex:1;font-size:13.5px;font-weight:600;">${inv.num} — ${clientById(inv.clientId).name}</div>
      ${statusDot(inv.status)}
      <span class="tabular" style="font-weight:700;font-size:13.5px;min-width:100px;text-align:right;">${fmtMoney(invoiceTotal(inv))}</span>
    </div>`).join('') || `<div class="empty-note">No invoices yet — create your first one with + New.</div>`;
}

/* ---------------- Invoices ---------------- */
let invoiceSeg = 'active';
let invoiceType = 'all';
function setInvoiceSeg(seg){ invoiceSeg = seg; renderInvoices(); }
function renderInvoices(){
  const q = (document.getElementById('inv-search').value||'').toLowerCase();
  document.getElementById('seg-active').classList.toggle('active', invoiceSeg==='active');
  document.getElementById('seg-paid').classList.toggle('active', invoiceSeg==='paid');
  document.getElementById('seg-active-n').textContent = invoices.filter(i=>i.status==='active').length;
  document.getElementById('seg-paid-n').textContent = invoices.filter(i=>i.status==='paid').length;
  const filtered = invoices.filter(inv=>{
    const matchSeg = inv.status===invoiceSeg && (invoiceType==='all' || inv.type===invoiceType);
    const matchQ = !q || inv.num.toLowerCase().includes(q) || clientById(inv.clientId).name.toLowerCase().includes(q);
    return matchSeg && matchQ;
  }).sort((a,b)=> (document.getElementById('inv-sort')||{}).value==='amount' ? invoiceTotal(b)-invoiceTotal(a) : new Date(b.date)-new Date(a.date));
  document.getElementById('filter-btn').classList.toggle('on', invoiceType!=='all' || (document.getElementById('inv-sort')||{}).value==='amount');
  document.getElementById('invoices-tbody').innerHTML = filtered.map(inv=>`
    <tr>
      <td><span class="type-icon">${typeIcon(inv)}</span> <span class="row-name">${inv.num}</span></td>
      <td>${clientChip(inv.clientId)}</td>
      <td class="tabular">${fmtDate(inv.date)}</td>
      <td class="tabular row-name">${fmtMoney(invoiceTotal(inv))}</td>
      <td>${statusDot(inv.status)}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="openInvoiceCreate(${inv.id})">View</button></td>
    </tr>
  `).join('') || `<tr><td colspan="6"><div class="empty-note">No invoices here.</div></td></tr>`;
}

/* ---------------- Detailed invoice create ---------------- */
let icDraft = null;
function openInvoiceCreate(existingId){
  if(existingId){
    const inv = invoices.find(i=>i.id===existingId);
    icDraft = { id: inv.id, clientId: inv.clientId, items: inv.items.map(i=>({...i})), status: inv.status, num: inv.num, type: inv.type };
  } else {
    if(!clients.length){ openNewClient(true); icDraft = { id:null, clientId: null, items:[{label:'', price:0, qty:1}], status:'draft', num:null, type:'detailed' }; }
    else icDraft = { id:null, clientId: clients[0].id, items:[{label:'', price:0, qty:1}], status:'draft', num:null, type:'detailed' };
  }
  icDiscountOn = false; document.getElementById('ic-discount-checkbox').classList.remove('checked'); document.getElementById('ic-discount-checkbox').textContent=''; document.getElementById('ic-discount-field').style.display='none';
  resetIcFields(); renderIcMethods();
  populateIcClientSelect();
  document.getElementById('ic-status-chip').textContent = icDraft.status.charAt(0).toUpperCase()+icDraft.status.slice(1);
  renderInvoiceCreateParty();
  renderInvoiceCreateItems();
  showView('invoice-create');
}
function populateIcClientSelect(){
  document.getElementById('ic-client-select').innerHTML =
    (clients.length ? '' : `<option value="">—</option>`) + clients.map(c=>`<option value="${c.id}" ${c.id===icDraft.clientId?'selected':''}>${c.name}</option>`).join('')
    + `<option value="__new__">+ Add new client…</option>`;
}
function renderInvoiceCreateParty(){
  const val = document.getElementById('ic-client-select').value;
  if(val === '__new__'){
    document.getElementById('ic-client-select').value = icDraft.clientId;
    openNewClient(true);
    return;
  }
  icDraft.clientId = parseInt(val,10) || null;
  const c = icDraft.clientId ? clientById(icDraft.clientId) : {email:'', phone:''};
  document.getElementById('ic-client-email').textContent = c.email || '—';
  document.getElementById('ic-client-phone').textContent = c.phone || '—';
}
function renderInvoiceCreateItems(){
  document.getElementById('ic-items-tbody').innerHTML = icDraft.items.map((it,i)=>`
    <tr>
      <td>
        <input type="text" list="ic-product-list-${i}" value="${(it.label||'').replace(/"/g,'&quot;')}" placeholder="Write or select a product ..." oninput="icItemChanged(${i},'label',this.value)" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:8px 10px;background:var(--surface-muted);color:var(--ink);font-size:12.5px;"/>
        <datalist id="ic-product-list-${i}">${products.map(p=>`<option value="${p.name.replace(/"/g,'&quot;')}">`).join('')}</datalist>
      </td>
      <td><input type="number" value="${it.price}" class="tabular" oninput="icItemChanged(${i},'price',this.value)" style="width:100px;border:1px solid var(--border);border-radius:8px;padding:8px 10px;background:var(--surface-muted);color:var(--ink);font-size:12.5px;"/></td>
      <td><input type="number" value="${it.qty}" class="tabular" oninput="icItemChanged(${i},'qty',this.value)" style="width:70px;border:1px solid var(--border);border-radius:8px;padding:8px 10px;background:var(--surface-muted);color:var(--ink);font-size:12.5px;"/></td>
      <td class="tabular ic-row-total">${fmtMoney(it.price*it.qty)}</td>
      <td><button class="item-row-remove" onclick="removeIcItem(${i})">✕</button></td>
    </tr>
  `).join('');
  renderIcTotal();
}
function icItemChanged(i, field, value){
  icDraft.items[i][field] = field==='label' ? value : (parseFloat(value)||0);
  const rows = document.querySelectorAll('#ic-items-tbody tr');
  if(field==='label'){
    const match = products.find(p=>p.name===value);
    if(match && rows[i]){
      icDraft.items[i].price = match.price;
      const priceInput = rows[i].querySelectorAll('input')[1];
      if(priceInput) priceInput.value = match.price;
    }
  }
  if(rows[i]) rows[i].querySelector('.ic-row-total').textContent = fmtMoney(icDraft.items[i].price*icDraft.items[i].qty);
  renderIcTotal();
}
function addInvoiceCreateItem(){ icDraft.items.push({label:'', price:0, qty:1}); renderInvoiceCreateItems(); }
function removeIcItem(i){ if(icDraft.items.length<=1) return; icDraft.items.splice(i,1); renderInvoiceCreateItems(); }
let icDiscountOn = false;
function toggleIcDiscount(){
  icDiscountOn = !icDiscountOn;
  const box = document.getElementById('ic-discount-checkbox');
  box.classList.toggle('checked', icDiscountOn);
  box.textContent = icDiscountOn ? '✓' : '';
  document.getElementById('ic-discount-field').style.display = icDiscountOn ? '' : 'none';
  renderIcTotal();
}
function activateMethod(btn, name){
  const id = btn && btn.dataset.method ? btn.dataset.method : (name==='PayPal'?'paypal':'card');
  const m = payMethods.find(x=>x.id===id); if(m) m.active = true;
  renderMethods(); renderIcMethods();
  pushToast('Method activated', name+' is now active.');
}
function finalizeInvoiceCreate(){
  const items = icFinalItems();
  if(!icDraft.clientId){ pushToast('Check the form','Add a client to this invoice first.'); openNewClient(true); return; }
  if(!icDraft.id && !checkInvoiceQuota()) return;
  if(icDraft.id){
    const inv = invoices.find(i=>i.id===icDraft.id);
    inv.clientId = icDraft.clientId; inv.items = items;
    renderInvoices(); renderDashboard();
    pushToast('Invoice updated', inv.num+' saved.');
    showView('invoices');
    return;
  }
  const num = nextInvoiceNum();
  const inv = { id: nextInvoiceId++, num, clientId: icDraft.clientId, items, date: isoDate(new Date()), status:'active', type:'detailed' };
  invoices.unshift(inv);
  renderInvoices(); renderDashboard();
  openSentModal('invoice', inv.id, num);
}

/* ---------------- Express invoice ---------------- */
function openExpressInvoice(){
  document.getElementById('ex-amount').value = '500 XOF';
  document.getElementById('ex-desc').value = '';
  document.getElementById('ex-discount-field').style.display = 'none';
  document.getElementById('ex-discount-btn').style.display = '';
  document.getElementById('express-overlay').classList.add('open');
}
function closeExpressInvoice(){ document.getElementById('express-overlay').classList.remove('open'); }
function submitExpressInvoice(){
  const amt = parseInt((document.getElementById('ex-amount').value||'0').replace(/[^0-9]/g,'')||'0',10);
  const desc = document.getElementById('ex-desc').value.trim() || 'Express payment';
  const exDisc = document.getElementById('ex-discount-field').style.display==='none' ? 0 : Math.min(100, Math.max(0, parseFloat(document.getElementById('ex-discount').value)||0));
  const num = nextInvoiceNum();
  if(!checkInvoiceQuota()) return;
  if(!clients.length){ clients.push({id:1, name:T('Walk-in customer'), phone:'', email:''}); renderClients(); }
  const inv = { id: nextInvoiceId++, num, clientId: clients[0].id, items: exDisc ? [{label:desc, price:amt, qty:1},{label:'Discount '+exDisc+'%', price:-Math.round(amt*exDisc/100), qty:1}] : [{label:desc, price:amt, qty:1}], date: isoDate(new Date()), status:'active', type:'express' };
  invoices.unshift(inv);
  renderInvoices(); renderDashboard();
  closeExpressInvoice();
  openSentModal('invoice', inv.id, num);
}

/* ---------------- Sent / share modal ---------------- */
let sentContext = null;
function openSentModal(kind, id, label){
  sentContext = {kind, id};
  document.getElementById('sent-title').textContent = kind==='invoice' ? 'The invoice is ready to be sent!' : 'The payment link is ready to be shared!';
  const link = buildPaymentLink(kind, id);
  document.getElementById('sent-link-input').value = link;
  document.getElementById('sent-link-input').dataset.real = link;
  document.getElementById('sent-email-link').href = `mailto:?subject=${encodeURIComponent('Payment for '+label)}&body=${encodeURIComponent('Please pay here: '+link)}`;
  document.getElementById('sent-overlay').classList.add('open');
}
function closeSentModal(){ document.getElementById('sent-overlay').classList.remove('open'); }
function copySentLink(){
  const input = document.getElementById('sent-link-input');
  copyText(input.dataset.real || input.value);
  pushToast('Link copied', 'Paste it anywhere to share.');
}
function sentShareVia(channel){
  const link = document.getElementById('sent-link-input').dataset.real || '';
  if(channel==='WhatsApp'){ window.open('https://wa.me/?text='+encodeURIComponent(T('Please pay here:')+' '+link), '_blank'); }
  else if(channel==='SMS'){ location.href = 'sms:?&body='+encodeURIComponent(T('Please pay here:')+' '+link); }
  else { copyText('<iframe src="'+link+'" width="420" height="640" style="border:0"></iframe>'); pushToast('Link copied', 'Paste it anywhere to share.'); return; }
  pushToast('Shared via '+channel, 'This is a sandbox — no real message was sent.');
}
function previewSentLink(){
  if(!sentContext) return;
  closeSentModal();
  location.hash = payHash(sentContext.kind, sentContext.id);
}

/* ---------------- Payment links ---------------- */
function renderPaylinks(){
  document.getElementById('paylinks-tbody').innerHTML = paymentLinks.map(lk=>`
    <tr>
      <td class="row-name">${lk.title}</td>
      <td class="tabular">${lk.type==='reusable'?'Any amount':fmtMoney(lk.amount)}</td>
      <td><span class="pill" style="background:var(--surface-2);color:var(--ink-soft);">${lk.type==='reusable'?'Reusable':'One-time'}</span></td>
      <td class="tabular">${fmtMoney(lk.collected)}</td>
      <td>${statusDot(lk.status==='paid'?'paid':'active')}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="openPaylinkDetail(${lk.id})">View</button></td>
    </tr>
  `).join('') || `<tr><td colspan="6"><div class="empty-note">No payment links yet.</div></td></tr>`;
}
function submitPaylinkCreate(){
  const title = document.getElementById('pl-title').value.trim() || 'Payment link';
  const amount = parseInt(document.getElementById('pl-amount').value.replace(/[^0-9]/g,'')||'0',10);
  const repeated = document.getElementById('pl-repeated').classList.contains('on');
  const newId = nextLinkId++;
  paymentLinks.unshift({id:newId, title, amount, type: repeated?'reusable':'onetime', collected:0, status:'active'});
  renderPaylinks(); renderDashboard();
  showView('paylinks');
  openSentModal('link', newId, title);
}
function openPaylinkDetail(id){ openSentModal('link', id, paymentLinks.find(l=>l.id===id).title); }

/* ---------------- Products & store ---------------- */
function renderProducts(){
  document.getElementById('products-tbody').innerHTML = products.map(p=>`
    <tr>
      <td><div style="display:flex;align-items:center;gap:10px;">${p.image ? `<img src="${p.image}" alt="" style="width:28px;height:28px;border-radius:7px;object-fit:cover;">` : `<span style="width:28px;height:28px;border-radius:7px;background:${p.swatch};display:inline-block;"></span>`}<span class="row-name">${p.name}</span></div></td>
      <td class="tabular">${p.qty}</td>
      <td class="tabular row-name">${fmtMoney(p.price).replace(' XOF','')}</td>
      <td><button class="toggle ${p.published?'on':''}" onclick="toggleProductPublish(${p.id})"></button></td>
      <td><button class="btn btn-ghost btn-sm" onclick="editProduct(${p.id})">Edit</button></td>
    </tr>
  `).join('');
  document.getElementById('store-grid').innerHTML = products.filter(p=>p.published).map(p=>`
    <div class="card product-card" style="cursor:pointer;" onclick="editProduct(${p.id})" title="Tap to edit">
      ${p.image ? `<img src="${p.image}" alt="" class="pos-thumb" style="object-fit:cover;margin-bottom:10px;">` : `<div class="pos-thumb" style="background:${p.swatch};margin-bottom:10px;"></div>`}
      <div class="row-name">${p.name}</div>
      <div class="tabular" style="color:var(--primary);font-weight:700;">${fmtMoney(p.price)}</div>
    </div>`).join('') || `<div class="empty-note">No published products yet.</div>`;
}
function toggleProductPublish(id){ const p = products.find(x=>x.id===id); p.published = !p.published; renderProducts(); }
let editingProductId = null;
function resetProductForm(){
  editingProductId = null;
  document.getElementById('pf-title').textContent = 'New Product';
  document.getElementById('pf-submit-btn').textContent = 'Add product';
  document.getElementById('pf-name').value = '';
  document.getElementById('pf-price').value = '10 000';
  document.getElementById('pf-sku').value = '';
  document.getElementById('pf-details').value = '';
  resetUpload(document.getElementById('pf-image'));
}
function editProduct(id){
  const p = products.find(x=>x.id===id);
  editingProductId = id;
  document.getElementById('pf-title').textContent = 'Edit Product';
  document.getElementById('pf-submit-btn').textContent = 'Save product';
  document.getElementById('pf-name').value = p.name;
  document.getElementById('pf-price').value = String(p.price);
  document.getElementById('pf-sku').value = p.sku || '';
  document.getElementById('pf-details').value = p.details || '';
  document.getElementById('pf-publish').classList.toggle('on', !!p.published);
  resetUpload(document.getElementById('pf-image'), p.image);
  showView('product-new');
}
function submitProductForm(){
  const name = document.getElementById('pf-name').value.trim();
  if(!name){ document.getElementById('pf-name').focus(); return; }
  const price = parseInt(document.getElementById('pf-price').value.replace(/[^0-9]/g,'')||'0',10);
  if(editingProductId){
    const p = products.find(x=>x.id===editingProductId);
    p.name = name; p.price = price; p.shortName = name.split(' ')[0];
    p.sku = document.getElementById('pf-sku').value.trim(); p.details = document.getElementById('pf-details').value.trim();
    p.published = document.getElementById('pf-publish').classList.contains('on');
    if(document.getElementById('pf-image').dataset.img) p.image = document.getElementById('pf-image').dataset.img;
    pushToast('Product updated', name+' saved.');
  } else {
    const swatches = ['#BEE8DF','#F8D2E0','#FBE3C4','#DED4F5','#CFE3F7','#D8EFC8'];
    const newId = Math.max(...products.map(p=>p.id))+1;
    products.unshift({id:newId, name, shortName:name.split(' ')[0], qty:10, price, published: document.getElementById('pf-publish').classList.contains('on'), swatch: swatches[newId % swatches.length], sku: document.getElementById('pf-sku').value.trim(), details: document.getElementById('pf-details').value.trim(), image: document.getElementById('pf-image').dataset.img || ''});
    pushToast('Product added', name+' is now live.');
  }
  renderProducts();
  showView('products');
}
function openStorefrontPreview(){
  document.getElementById('storefront-grid').innerHTML = products.filter(p=>p.published).map(p=>`
    <div class="card product-card">
      ${p.image ? `<img src="${p.image}" alt="" class="pos-thumb" style="object-fit:cover;margin-bottom:10px;">` : `<div class="pos-thumb" style="background:${p.swatch};margin-bottom:10px;"></div>`}
      <div class="row-name">${p.name}</div>
      <div class="tabular" style="color:var(--primary);font-weight:700;margin-bottom:8px;">${fmtMoney(p.price)}</div>
      <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center;" onclick="buyStoreProduct(${p.id})">Buy now</button>
    </div>`).join('');
  document.getElementById('storefront-overlay').classList.add('open');
}
function closeStorefrontPreview(){ document.getElementById('storefront-overlay').classList.remove('open'); }
function buyStoreProduct(id){ document.getElementById('storefront-overlay').classList.remove('open'); openCheckoutNow('product', id); }

/* ---------------- Clients ---------------- */
function renderClients(){
  document.getElementById('clients-tbody').innerHTML = clients.map(c=>`
    <tr>
      <td>${clientChip(c.id)}</td>
      <td>${c.phone || '–'}</td>
      <td>${c.email || '–'}</td>
      <td class="tabular">${clientInvoiceCount(c.id)}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="openClientProfile(${c.id})">View</button></td>
    </tr>
  `).join('');
}
let newClientFromInvoice = false;
function openNewClient(fromInvoice){
  newClientFromInvoice = !!fromInvoice;
  document.getElementById('cl-name').value = '';
  document.getElementById('cl-phone').value = '+221 77 000 00 00';
  document.getElementById('cl-email').value = '';
  document.getElementById('client-overlay').classList.add('open');
  setTimeout(()=> document.getElementById('cl-name').focus(), 50);
}
function closeNewClient(){
  document.getElementById('client-overlay').classList.remove('open');
  newClientFromInvoice = false;
}
function submitNewClient(){
  const name = document.getElementById('cl-name').value.trim();
  if(!name){ document.getElementById('cl-name').focus(); return; }
  const phone = document.getElementById('cl-phone').value.trim();
  const email = document.getElementById('cl-email').value.trim();
  const newId = Math.max(...clients.map(c=>c.id))+1;
  clients.unshift({id:newId, name, phone, email});
  const cameFromInvoice = newClientFromInvoice;
  document.getElementById('client-overlay').classList.remove('open');
  newClientFromInvoice = false;
  renderClients();
  pushToast('Client added', name+' was added to your client list.');
  if(cameFromInvoice && icDraft){
    icDraft.clientId = newId;
    populateIcClientSelect();
    renderInvoiceCreateParty();
  }
}
function openClientProfile(id){
  closeNewMenu();
  const c = clientById(id);
  const custInvoices = invoices.filter(i=>i.clientId===id);
  document.getElementById('client-profile-modal').innerHTML = `
    <div class="modal-head"><h3><span class="avatar avatar-sm" style="background:${avatarColor(id)};">${initials(c.name)[0]}</span>${c.name}</h3><button class="modal-close" onclick="closeClientProfile()">✕</button></div>
    <div class="modal-body">
      <div class="page-sub" style="margin-bottom:16px;">${c.phone||'–'} · ${c.email||'–'}</div>
      <div class="table-wrap">
        <table><thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>${custInvoices.map(inv=>`<tr><td>${typeIcon(inv)} ${inv.num}</td><td class="tabular">${fmtDate(inv.date)}</td><td class="tabular">${fmtMoney(invoiceTotal(inv))}</td><td>${statusDot(inv.status)}</td></tr>`).join('') || `<tr><td colspan="4"><div class="empty-note">No invoices yet.</div></td></tr>`}</tbody></table>
      </div>
      <button class="btn btn-primary" style="margin-top:16px;" onclick="closeClientProfile(); openInvoiceCreate(); document.getElementById('ic-client-select').value='${id}'; renderInvoiceCreateParty();">New invoice for ${c.name}</button>
    </div>
  `;
  document.getElementById('client-profile-overlay').classList.add('open');
}
function closeClientProfile(){ document.getElementById('client-profile-overlay').classList.remove('open'); }

/* ---------------- POS launcher + sell ---------------- */
const posCategories = ['All categories','Clothing','Accessories'];
function productCategory(p){
  if(['T-shirt coton','Casquette','Sandales'].includes(p.name)) return 'Clothing';
  return 'Accessories';
}
let posActiveCat = 'All categories';
let posOrder = [];
let posMethod = 'Cash (POS)';
function openPosSell(){
  posOrder = [{ productId:1, qty:1 }, { productId:3, qty:2 }].filter(l=>products.some(p=>p.id===l.productId));
  posClientId = null; document.getElementById('pos-client-btn').textContent = '+ Add a client';
  document.getElementById('pos-discount').value = '0';
  posActiveCat = 'All categories';
  posMethod = 'Cash (POS)';
  document.getElementById('pos-sell-page').style.display = 'flex';
  document.getElementById('pos-sell-page').classList.add('active');
  document.querySelector('.shell').style.display = 'none';
  renderPosCatPills();
  renderPosProducts('');
  renderPosOrder();
  renderPosMethodTabs();
}
function exitPosSell(){
  document.getElementById('pos-sell-page').style.display = 'none';
  document.getElementById('pos-sell-page').classList.remove('active');
  document.querySelector('.shell').style.display = '';
  renderTxHistory(); renderDashboard();
}
function renderPosCatPills(){
  document.getElementById('pos-cat-pills').innerHTML = posCategories.map(c=>`
    <button class="pos-cat-pill ${c===posActiveCat?'active':''}" onclick="posSetCategory('${c}')">${T(c)}</button>
  `).join('');
}
function posSetCategory(c){ posActiveCat = c; renderPosCatPills(); renderPosProducts(''); }
function renderPosProducts(query){
  const q = (query||'').toLowerCase();
  const list = products.filter(p=> (posActiveCat==='All categories' || productCategory(p)===posActiveCat) && p.name.toLowerCase().includes(q));
  document.getElementById('pos-product-grid').innerHTML = list.map(p=>`
    <button class="pos-product" onclick="posAddProduct(${p.id})">
      ${p.image ? `<img src="${p.image}" alt="" class="pos-thumb" style="object-fit:cover;">` : `<div class="pos-thumb" style="background:${p.swatch};"></div>`}
      <div class="pname">${p.shortName}</div>
      <div class="pprice tabular">${fmtMoney(p.price)}</div>
    </button>
  `).join('') || `<div class="empty-note">No matching products.</div>`;
}
function posAddProduct(id){
  const line = posOrder.find(l=>l.productId===id);
  if(line) line.qty++;
  else posOrder.push({productId:id, qty:1});
  renderPosOrder();
}
function posChangeQty(id, delta){
  const line = posOrder.find(l=>l.productId===id);
  if(!line) return;
  line.qty += delta;
  if(line.qty<=0) posOrder = posOrder.filter(l=>l.productId!==id);
  renderPosOrder();
}
function renderPosOrder(){
  document.getElementById('pos-order-lines').innerHTML = posOrder.map(l=>{
    const p = products.find(x=>x.id===l.productId);
    return `<div class="pos-order-line">
      <div><div class="name">${p.shortName}</div><div class="qty">${T('Qty '+l.qty)}
        <button class="pos-qty-btn" onclick="posChangeQty(${p.id},-1)">−</button>
        <button class="pos-qty-btn" onclick="posChangeQty(${p.id},1)">+</button>
      </div></div>
      <div class="amt tabular">${fmtMoney(p.price*l.qty)}</div>
    </div>`;
  }).join('') || `<div class="empty-note">No items yet — tap a product to add it.</div>`;
  const subtotal = posOrder.reduce((s,l)=> s + products.find(p=>p.id===l.productId).price*l.qty, 0);
  const disc = Math.round(subtotal * (parseFloat(document.getElementById('pos-discount').value)||0) / 100);
  document.getElementById('pos-subtotal').textContent = fmtMoney(subtotal);
  document.getElementById('pos-discount-amt').textContent = (disc? '−' : '') + fmtMoney(disc);
  document.getElementById('pos-total').textContent = fmtMoney(subtotal-disc);
  document.getElementById('pos-pay-btn').textContent = 'Pay '+fmtMoney(subtotal-disc);
}
function renderPosMethodTabs(){
  const methods = ['Cash (POS)','Card (POS)','Online'];
  document.getElementById('pos-method-tabs').innerHTML = methods.map(m=>`
    <button class="pos-method-tab ${m===posMethod?'active':''}" onclick="posSetMethod('${m}')">${m}</button>
  `).join('');
}
function posSetMethod(m){ posMethod = m; renderPosMethodTabs(); }
function posPay(){
  const gross = posOrder.reduce((s,l)=> s + products.find(p=>p.id===l.productId).price*l.qty, 0);
  const subtotal = gross - Math.round(gross * (parseFloat(document.getElementById('pos-discount').value)||0) / 100);
  if(!subtotal){ pushToast('Nothing to charge', 'Add a product to the order first.'); return; }
  if(posMethod === 'Online'){
    exitPosSell();
    const newId = nextLinkId++;
    paymentLinks.unshift({id:newId, title:'POS sale', amount:subtotal, type:'onetime', collected:0, status:'active'});
    renderPaylinks();
    location.hash = payHash('link', newId);
    return;
  }
  const cl = posClientId ? clientById(posClientId) : null;
  transactions.unshift({label:'POS sale'+(cl?' — '+cl.name:''), amount:subtotal, method: posMethod==='Cash (POS)'?'Cash':'Card', time:new Date().toISOString(), pos:true});
  posStats.sales += subtotal; posStats.orders += 1;
  pushToast('Payment received', fmtMoney(subtotal)+' via '+T(posMethod)+'.');
  posOrder = [];
  posClientId = null; document.getElementById('pos-client-btn').textContent = '+ Add a client';
  document.getElementById('pos-discount').value = '0';
  renderPosOrder(); renderPosStats();
}

/* ---------------- Reports ---------------- */
function renderReports(){
  drawTrendChart();
  const mt = Object.assign({'Mixx Wallet':0,'Bank transfer':0,'Card':0,'PayPal':0}, methodBase);
  liveTx().forEach(t=>{ mt[t.method] = (mt[t.method]||0) + t.amount; });
  const mSum = Object.values(mt).reduce((a,b)=>a+b,0) || 1;
  const series = ['--series-1','--series-2','--series-3','--series-4','--series-2'];
  document.getElementById('method-bars').innerHTML = Object.keys(mt).filter((k,i)=> i<4 || mt[k]>0).map((k,i)=>({label:T(k), pct:Math.round(mt[k]*100/mSum), series:series[i]})).map(m=>`<div class="bar-row"><span class="name">${m.label}</span><div class="bar-track"><div class="bar-fill" style="width:${m.pct}%;background:var(${m.series})"></div></div><span class="val tabular">${m.pct}%</span></div>`).join('');
  const top = [...clients].sort((a,b)=> clientInvoiceCount(b.id)-clientInvoiceCount(a.id)).slice(0,5);
  document.getElementById('top-clients').innerHTML = top.map(c=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);">
      <span class="avatar avatar-sm" style="background:${avatarColor(c.id)};">${initials(c.name)[0]}</span>
      <div style="flex:1;font-size:13px;font-weight:600;">${c.name}</div>
      <span class="tabular" style="font-size:12.5px;font-weight:700;">${T(clientInvoiceCount(c.id)+' invoices')}</span>
    </div>`).join('');
  const tc = document.getElementById('top-clients');
  if(tc.lastElementChild) tc.lastElementChild.style.borderBottom='none';
}
function drawTrendChart(){
  const svg = document.getElementById('trend-chart');
  if(!svg) return;
  const W=640,H=220,padL=42,padR=16,padT=16,padB=28;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const thisMonth = liveTx().filter(t=> new Date(t.time) >= monthStart).reduce((s,t)=>s+t.amount,0);
  const data = trendBase.map((v,i)=> (i===5 ? v + thisMonth : v) / 1e6);
  const max = (Math.max(...data)||1)*1.15;
  const x = i => padL + (i/(data.length-1))*(W-padL-padR);
  const y = v => padT + (1-(v/max))*(H-padT-padB);
  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months = [5,4,3,2,1,0].map(k=>{ const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-k); return MN[d.getMonth()]; });
  let grid='', pts=[];
  for(let g=0; g<=3; g++){ const gy = padT + (g/3)*(H-padT-padB); grid += `<line x1="${padL}" y1="${gy}" x2="${W-padR}" y2="${gy}" stroke="var(--chart-grid)" stroke-width="1"/>`; }
  data.forEach((v,i)=> pts.push([x(i), y(v)]));
  const linePath = pts.map((p,i)=> (i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const areaPath = linePath + ` L${pts[pts.length-1][0].toFixed(1)},${H-padB} L${pts[0][0].toFixed(1)},${H-padB} Z`;
  let labels='';
  months.forEach((m,i)=>{ labels += `<text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="Figtree, sans-serif">${T(m)}</text>`; });
  const lastX = pts[pts.length-1][0], lastY = pts[pts.length-1][1];
  svg.innerHTML = `
    <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--series-1)" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="var(--series-1)" stop-opacity="0.02"/>
    </linearGradient></defs>
    ${grid}
    <path d="${areaPath}" fill="url(#trendFill)"/>
    <path d="${linePath}" fill="none" stroke="var(--series-1)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="var(--surface)" stroke="var(--series-1)" stroke-width="2"/>`).join('')}
    <circle cx="${lastX}" cy="${lastY}" r="4.5" fill="var(--series-1)"/>
    <text x="${lastX}" y="${lastY-12}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)" font-family="Figtree, sans-serif">${data[data.length-1] >= 1 ? data[data.length-1].toFixed(2)+'M' : Math.round(data[data.length-1]*1000)+'K'}</text>
    ${labels}
  `;
}

/* ---------------- Shared checkout engine (Mixx Wallet / Card / PayPal / Bank) ---------------- */
function payHash(kind, id){ return '#pay=' + (loadedOwner || 'guest') + '/' + kind + '-' + id; }
function buildPaymentLink(kind, id){ return location.href.split('#')[0] + payHash(kind, id); }
function copyText(text){
  try{ if(navigator.clipboard) navigator.clipboard.writeText(text).catch(()=>{}); }catch(e){}
  try{
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0'; ta.style.top='0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }catch(e){}
}
let checkoutMethod = 'mixx';
function checkoutContext(kind, id){
  if(kind==='invoice'){
    const inv = invoices.find(i=>i.id===id);
    return { title: clientById(inv.clientId).name, sub: inv.num, amount: invoiceTotal(inv), lines: inv.items.map(it=>({label:it.label||'Item', amount:it.price*it.qty})), onPaid: ()=>{ inv.status='paid'; renderInvoices(); renderDashboard(); } };
  }
  if(kind==='link'){
    const lk = paymentLinks.find(l=>l.id===id);
    const amt = lk.type==='reusable' ? (lk.amount||10000) : lk.amount;
    return { title: merchant.name, sub: lk.title, amount: amt, lines:[{label:lk.title, amount:amt}], onPaid: ()=>{ lk.collected += amt; if(lk.type==='onetime') lk.status='paid'; renderPaylinks(); } };
  }
  const p = products.find(pr=>pr.id===id);
  return { title: merchant.name, sub:p.name, amount:p.price, lines:[{label:p.name, amount:p.price}], onPaid: ()=>{ if(p.qty>0) p.qty--; renderProducts(); addNotification('🛍️','New order from your online store','Today'); } };
}
function renderCheckoutCard(kind, id, activeMethod, containerId){
  containerId = containerId || 'checkout-card';
  checkoutMethod = activeMethod || 'mixx';
  const ctx = checkoutContext(kind, id);
  const card = document.getElementById(containerId);
  if(!card) return;
  const isStandalone = containerId==='checkout-card';
  card.innerHTML = `
    <div class="checkout-head">
      ${isStandalone ? `<button onclick="backToDashboard()" style="background:none;border:none;color:#fff;opacity:.9;font-size:12px;font-weight:700;cursor:pointer;padding:0 0 10px;display:flex;align-items:center;gap:5px;">← Back to dashboard</button>` : ''}
      <div style="font-size:12px;opacity:.85;">${merchant.name}</div>
      <div style="font-size:15px;margin-top:8px;">${ctx.title} · ${ctx.sub}</div>
      <div style="font-size:11.5px;opacity:.8;margin-top:12px;">Amount due</div>
      <div class="amt tabular">${fmtMoney(ctx.amount)}</div>
    </div>
    <div class="checkout-body">
      <div class="checkout-sandbox-note">⚠️ Sandbox checkout — this is a demo environment, no real funds move.</div>
      ${ctx.lines.map(l=>`<div class="checkout-line"><span>${l.label}</span><span class="tabular">${fmtMoney(l.amount)}</span></div>`).join('')}
      <div class="pm-tabs">
        ${['mixx','card','paypal','bank'].map(k=>{
          const cls = k==='mixx' ? 'mixx' : (k==='paypal' ? 'paypal' : '');
          const labelHtml = k==='mixx' ? 'Mixx Wallet' : k==='card' ? `<div class="card-marks"><span class="card-mark-visa">VISA</span><span class="card-mark-mc"><span></span><span></span></span></div>` : k==='paypal' ? 'PayPal' : 'Bank transfer';
          return `<div class="pm-tab ${cls} ${k===activeMethod?'active':''}" onclick="renderCheckoutCard('${kind}', ${id}, '${k}', '${containerId}')">${labelHtml}</div>`;
        }).join('')}
      </div>
      <div class="pm-form" id="${containerId}-form"></div>
    </div>
  `;
  const form = document.getElementById(containerId+'-form');
  if(activeMethod==='card'){
    form.innerHTML = `
      <div class="field"><label>Card number</label><input class="mono" value="4242 4242 4242 4242"/></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div class="field"><label>Expiry</label><input class="mono" value="09/29"/></div>
        <div class="field"><label>CVV</label><input class="mono" value="•••"/></div>
      </div>
      <div class="pm-note">Card details are tokenised — Mixx Business never stores the full card number.</div>
      <button class="btn btn-green" style="justify-content:center;margin-top:4px;" onclick="checkoutConfirm('${kind}', ${id}, '${containerId}')">${T('Pay now — '+fmtMoney(ctx.amount))}</button>
    `;
  } else if(activeMethod==='paypal'){
    form.innerHTML = `
      <div class="field"><label>PayPal e-mail</label><input value="customer@example.com"/></div>
      <div class="pm-note">The customer confirms this payment by logging into PayPal.</div>
      <button class="btn btn-green" style="justify-content:center;margin-top:4px;" onclick="checkoutConfirm('${kind}', ${id}, '${containerId}')">${T('Pay now — '+fmtMoney(ctx.amount))}</button>
    `;
  } else if(activeMethod==='bank'){
    form.innerHTML = `
      <div class="pm-note">${T('Transfer to: '+merchant.name+' — IBAN '+(payout.iban||'SN08 XXXX XXXX XXXX')+' — reference '+ctx.sub+'.')}</div>
      <button class="btn btn-green" style="justify-content:center;margin-top:4px;" onclick="checkoutConfirm('${kind}', ${id}, '${containerId}')">I've sent the transfer</button>
    `;
  } else {
    form.innerHTML = `
      <div class="field"><label>Mixx Wallet number</label><input class="mono" value="+221 77 000 00 00"/></div>
      <div class="pm-note">The customer confirms this payment in their Mixx app or with their PIN.</div>
      <button class="btn btn-green" style="justify-content:center;margin-top:4px;" onclick="checkoutConfirm('${kind}', ${id}, '${containerId}')">${T('Pay now — '+fmtMoney(ctx.amount))}</button>
    `;
  }
  if(isStandalone) document.getElementById('checkout-footer').textContent = "Payments are encrypted and processed by Mixx Business's licensed payment partners.";
}
function checkoutConfirm(kind, id, containerId){
  containerId = containerId || 'checkout-card';
  const card = document.getElementById(containerId);
  card.innerHTML = `<div class="checkout-body" style="padding-top:40px;"><div class="pay-success">
    <div class="ring"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div style="font-weight:700;font-size:15px;">Confirming with your provider…</div>
  </div></div>`;
  setTimeout(()=>{
    const ref = 'MXB-' + Math.random().toString(36).slice(2,8).toUpperCase();
    const ctx = checkoutContext(kind, id);
    card.innerHTML = `<div class="checkout-body" style="padding-top:36px;"><div class="pay-success">
      <div class="ring"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div style="font-weight:700;font-size:17px;">Payment confirmed</div>
      <div class="page-sub" style="margin:0;">${T('Receipt '+ref+' · a copy was sent by SMS.')}</div>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="backToDashboard()">${T('← Back to dashboard')}</button>
    </div></div>`;
    ctx.onPaid();
    transactions.unshift({label:ctx.sub, amount:ctx.amount, method:({mixx:'Mixx Wallet',card:'Card',paypal:'PayPal',bank:'Bank transfer'})[checkoutMethod]||'Mixx Wallet', time:new Date().toISOString()});
    renderDashboard(); renderTxHistory();
    addNotification('💰', ctx.sub+' · '+fmtMoney(ctx.amount)+' collected.', 'Today');
    pushToast('Payment confirmed', ctx.sub+' · '+fmtMoney(ctx.amount)+' collected.');
  }, 1000);
}
function openCheckoutNow(kind, id){ location.hash = payHash(kind, id); }
function backToDashboard(){ location.hash = currentSession() ? '#app' : '#login'; }
/* ---------------- Toasts ---------------- */
function pushToast(title, body){
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = 'toast';
  const s = document.createElement('strong'); s.textContent = T(title);
  const b = document.createElement('span'); b.textContent = T(body||'');
  const wrap = document.createElement('div'); wrap.appendChild(s); wrap.appendChild(b);
  el.innerHTML = `<div style="font-size:16px;">✅</div>`; el.appendChild(wrap);
  stack.appendChild(el);
  setTimeout(()=>{ el.style.transition='opacity .3s ease'; el.style.opacity='0'; setTimeout(()=>el.remove(), 320); }, 3600);
}


/* =====================================================================
   v4 — accounts, guest mode, persistence, settings, plans, extras
   All reads/writes of accounts and data go through window.Store (store.js)
   ===================================================================== */

/* ---------- small helpers ---------- */
function lsGet(k, d){ try{ const v = localStorage.getItem(k); return v===null ? d : v; }catch(e){ return d; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function closeOverlay(id){ document.getElementById(id).classList.remove('open'); }
function openOverlay(id){ document.getElementById(id).classList.add('open'); }
function toggleShow(id, toggleEl){
  const el = document.getElementById(id);
  const on = toggleEl ? toggleEl.classList.contains('on') : el.style.display==='none';
  el.style.display = on ? '' : 'none';
}

/* ---------- state held for the loaded owner ---------- */
let loadedOwner = null;             // account id, or 'guest'
let account = null;                 // public account record of the signed-in merchant
let merchant = { name:'', owner:'', email:'', phone:'', city:'', plan:'free' };
let payout = { wallet:'', bank:'', iban:'', holder:'' };
let payMethods = [], notifications = [];
let posStats = { sales:0, orders:0 }, posSettings = { cashier:'', footer:'' };

function loadState(s){
  clients = s.clients || []; products = s.products || []; invoices = s.invoices || [];
  paymentLinks = s.paymentLinks || []; transactions = s.transactions || [];
  payMethods = s.payMethods || []; notifications = s.notifications || [];
  posStats = s.posStats || {sales:0, orders:0}; posSettings = s.posSettings || {cashier:'', footer:''};
  payout = s.payout || {wallet:'', bank:'', iban:'', holder:''};
  kpiBase = s.kpiBase || {revenue:0, active:0, paid:0, clients:0};
  trendBase = s.trendBase || [0,0,0,0,0,0]; methodBase = s.methodBase || {};
  nextInvoiceId = s.nextInvoiceId || (Math.max(0, ...invoices.map(i=>i.id)) + 1);
  nextLinkId = s.nextLinkId || (Math.max(0, ...paymentLinks.map(l=>l.id)) + 1);
}
function snapshot(){
  return { v:4, clients, products, invoices, paymentLinks, transactions, payMethods, notifications, posStats, posSettings, payout,
           kpiBase, trendBase, methodBase, nextInvoiceId, nextLinkId };
}
function setMerchantFromAccount(acc){
  account = acc;
  merchant = acc ? { name:acc.business, owner:acc.owner, email:acc.email, phone:acc.phone, city:acc.city, plan:acc.plan }
                 : { name:'Boutique Aissatou', owner:'Guest', email:'guest@mixx.africa', phone:'', city:'Dakar, Sénégal', plan:'free' };
}
function isGuest(){ return loadedOwner === 'guest'; }

/* Every render function calls persistSoon(), so any change is saved */
let persistTimer = null, restoring = false;
function persistSoon(){
  if(restoring || !loadedOwner) return;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persistNow, 150);
}
function persistNow(){
  if(!loadedOwner) return;
  const s = snapshot();
  if(isGuest()){ Store.saveGuestState(s); return; }
  Store.saveData(loadedOwner, s).catch(e=>{
    if(e.code==='storage_full') pushToast('Storage full','Remove some product images or export your data.');
  });
}
window.addEventListener('beforeunload', ()=>{ if(persistTimer){ clearTimeout(persistTimer); persistNow(); } });
['renderDashboard','renderInvoices','renderPaylinks','renderProducts','renderClients','renderMethods','renderNotifications','renderPosStats','renderTxHistory'].forEach(name=>{
  const fn = window[name];
  window[name] = function(){ const r = fn.apply(this, arguments); persistSoon(); return r; };
});

/* ---------- merchant chrome ---------- */
function applyMerchant(){
  document.querySelectorAll('.merchant-name').forEach(el=> el.textContent = merchant.name);
  document.querySelectorAll('.merchant-email').forEach(el=> el.textContent = merchant.email);
  document.querySelectorAll('.merchant-city').forEach(el=> el.textContent = merchant.city);
  document.querySelectorAll('.merchant-initial').forEach(el=> el.textContent = (merchant.name||'M').trim()[0].toUpperCase());
  const av = document.getElementById('user-avatar'); if(av) av.textContent = isGuest() ? 'G' : initials(merchant.name || 'M');
  const em = document.getElementById('user-email'); if(em) em.textContent = isGuest() ? T('Guest mode') : merchant.email;
  const planNames = { free:'Free plan', pro:'Professional plan', enterprise:'Enterprise plan' };
  document.getElementById('side-plan-name').textContent = planNames[merchant.plan] || 'Free plan';
  document.getElementById('side-plan-desc').textContent = merchant.plan==='free' ? invoicesThisMonth()+' of 10 invoices used this month' : 'Unlimited invoices and products';
  const showUp = merchant.plan==='free';
  document.getElementById('upgrade-btn').style.display = showUp ? '' : 'none';
  document.querySelector('#side-plan button').style.display = showUp ? '' : 'none';
  document.querySelectorAll('.pm-plan').forEach(p=>{
    const btn = p.querySelector('button'); if(!btn) return;
    const cur = p.dataset.plan===merchant.plan;
    btn.disabled = cur; btn.textContent = cur ? 'Current plan' : (p.dataset.plan==='free' ? 'Choose Free' : 'Choose Professional');
  });
  document.getElementById('guest-banner').classList.toggle('hidden', !isGuest());
  document.querySelectorAll('.guest-only').forEach(el=> el.classList.toggle('hidden', !isGuest()));
  document.querySelectorAll('.member-only').forEach(el=> el.classList.toggle('hidden', isGuest()));
}
function invoicesThisMonth(){
  const m = new Date().toISOString().slice(0,7);
  return invoices.filter(i=> String(i.date).slice(0,7)===m).length;
}
function checkInvoiceQuota(){
  if(merchant.plan!=='free' || isGuest()) return true;
  if(invoicesThisMonth() < 10) return true;
  pushToast('Free plan limit reached','Upgrade to Professional for unlimited invoices.');
  openUpgrade(); return false;
}

/* ---------- theme (shared with website via 'mbl_theme') ---------- */
function setAppTheme(theme){
  theme = theme==='white' ? 'white' : 'blue';
  document.documentElement.setAttribute('data-theme', theme);
  lsSet('mbl_theme', theme);
  document.querySelectorAll('[data-theme-btn]').forEach(b=> b.classList.toggle('active', b.getAttribute('data-theme-btn')===theme));
}

/* ---------- auth ---------- */
function currentSession(){ return Store.session.get(); }
function fieldError(input, show, msg){
  input.classList.toggle('invalid', !!show);
  const err = input.parentElement.querySelector('.err');
  if(err){ if(msg){ err.textContent = T(msg); } err.classList.toggle('show', !!show); }
  return !show;
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function submitLogin(){
  const idEl = document.getElementById('login-id'), p = document.getElementById('login-pass');
  const box = document.getElementById('login-error'); box.classList.remove('show');
  const ok = [fieldError(idEl, idEl.value.trim().length<3), fieldError(p, !p.value)].every(Boolean);
  if(!ok) return;
  Store.login(idEl.value, p.value).then(acc=>{
    const remember = document.getElementById('remember-box').classList.contains('checked');
    Store.clearGuest();
    Store.session.set({ uid:acc.id, role:acc.role }, remember);
    p.value = '';
    location.hash = acc.role==='admin' ? '#admin' : '#app';
    pushToast('Welcome back', acc.role==='admin' ? 'Signed in as administrator.' : 'Logged in to '+acc.business+'.');
  }).catch(e=>{
    box.textContent = T(e.code==='account_disabled' ? 'This account has been disabled. Contact support.' : 'Wrong username or password.');
    box.classList.add('show');
  });
}
function continueAsGuest(){
  Store.clearGuest();
  Store.session.set({ guest:true }, false);
  location.hash = '#app';
  pushToast('Guest mode','Try everything — nothing is saved after you close this tab.');
}
function socialLogin(provider){
  pushToast(provider+' sign-in', 'Not connected in this prototype — use a username and password, or continue as guest.');
}
let regPlan = 'free';
function pickPlan(p){ regPlan = p; document.querySelectorAll('#plan-picker .plan-opt').forEach(b=> b.classList.toggle('active', b.dataset.plan===p)); }
function submitRegister(){
  const n = document.getElementById('reg-name'), b = document.getElementById('reg-business'), u = document.getElementById('reg-username'),
        e = document.getElementById('reg-email'), ph = document.getElementById('reg-phone'),
        pw = document.getElementById('reg-pass'), pw2 = document.getElementById('reg-pass2');
  const terms = document.getElementById('terms-box').classList.contains('checked');
  const ok = [
    fieldError(n, !n.value.trim()), fieldError(b, !b.value.trim()),
    fieldError(u, !/^[a-z0-9._-]{3,20}$/i.test(u.value.trim()), 'Use 3–20 letters, numbers, dots or dashes.'),
    fieldError(e, !EMAIL_RE.test(e.value.trim()), 'Enter a valid e-mail address.'),
    fieldError(ph, ph.value.replace(/\D/g,'').length<8), fieldError(pw, pw.value.length<6),
    fieldError(pw2, pw2.value!==pw.value || !pw2.value),
  ].every(Boolean);
  document.getElementById('terms-err').classList.toggle('show', !terms);
  if(!ok || !terms){ pushToast('Check the form','Please fix the highlighted fields.'); return; }
  const country = document.getElementById('reg-country').value;
  const cities = { SN:'Dakar, Sénégal', TG:'Lomé, Togo', TZ:'Dar es Salaam, Tanzania' };
  Store.register({ username:u.value, email:e.value, password:pw.value, owner:n.value, business:b.value, phone:ph.value,
                   country, city:cities[country], plan: regPlan==='pro' ? 'pro' : 'free' })
    .then(acc=>{
      Store.clearGuest();
      Store.session.set({ uid:acc.id, role:'merchant' }, true);
      ['reg-name','reg-business','reg-username','reg-email','reg-phone','reg-pass','reg-pass2'].forEach(id=> document.getElementById(id).value='');
      location.hash = '#app';
      pushToast('Welcome to Mixx Business Lite', 'Your account for '+acc.business+' is ready.');
      if(regPlan==='enterprise') setTimeout(()=> window.open('../contact.html','_blank'), 400);
    }).catch(err=>{
      if(err.code==='username_taken') fieldError(u, true, 'This username is already taken.');
      else if(err.code==='username_invalid') fieldError(u, true, 'Use 3–20 letters, numbers, dots or dashes.');
      else if(err.code==='email_taken') fieldError(e, true, 'An account already uses this e-mail.');
      else pushToast('Storage full','Remove some product images or export your data.');
    });
}
function submitForgot(){
  const e = document.getElementById('forgot-email');
  if(!fieldError(e, !EMAIL_RE.test(e.value.trim()))) return;
  document.getElementById('forgot-form-body').classList.add('hidden');
  document.getElementById('forgot-done').classList.remove('hidden');
}
function doLogout(){
  closeUserMenu();
  if(persistTimer){ clearTimeout(persistTimer); persistNow(); }
  const wasGuest = isGuest();
  Store.session.clear(); if(wasGuest) Store.clearGuest();
  loadedOwner = null; account = null;
  location.hash = '#login';
  pushToast('Logged out', 'See you soon!');
}
function toggleDemoAccounts(){ document.getElementById('demo-accounts').classList.toggle('hidden'); }
function fillDemo(id, pw){ document.getElementById('login-id').value = id; document.getElementById('login-pass').value = pw; }

/* ---------- routing ----------
   #login  #register  #register/pro  #forgot  #app  #admin  #pay=<owner>/<kind>-<id> */
function showAuth(which){
  document.getElementById('checkout-page').classList.remove('active');
  document.getElementById('pos-sell-page').style.display = 'none';
  document.getElementById('shell').classList.remove('active');
  document.getElementById('shell').style.display = '';
  document.getElementById('admin-shell').classList.remove('active');
  document.getElementById('login-page').classList.remove('hidden');
  ['login','register','forgot'].forEach(k=> document.getElementById('auth-'+k).classList.toggle('hidden', k!==which));
  document.title = (which==='register' ? T('Create your free account') : which==='forgot' ? T('Reset your password') : T('Log in')) + ' — Mixx Business Lite';
  window.scrollTo(0,0);
}
function hideAllShells(){
  document.getElementById('checkout-page').classList.remove('active');
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('shell').classList.remove('active');
  document.getElementById('admin-shell').classList.remove('active');
  document.getElementById('pos-sell-page').style.display = 'none';
}
function ensureLoaded(owner){
  if(loadedOwner === owner) return true;
  if(persistTimer){ clearTimeout(persistTimer); persistNow(); }
  restoring = true;
  if(owner === 'guest'){ setMerchantFromAccount(null); loadState(Store.guestState()); }
  else {
    const s = Store.getDataSync(owner); if(!s){ restoring = false; return false; }
    loadState(s);
  }
  loadedOwner = owner;
  renderAll();
  restoring = false;
  return true;
}
async function showMerchantApp(sess){
  if(sess.guest){ ensureLoaded('guest'); }
  else {
    const acc = await Store.getAccount(sess.uid);
    if(!acc || acc.status!=='active'){ Store.session.clear(); location.replace('#login'); return; }
    setMerchantFromAccount(acc);
    if(!ensureLoaded(acc.id)){ Store.session.clear(); location.replace('#login'); return; }
  }
  hideAllShells();
  document.getElementById('shell').classList.add('active');
  document.getElementById('shell').style.display = '';
  document.title = T('Dashboard') + ' — Mixx Business Lite';
  applyMerchant();
}
async function route(){
  const h = location.hash;
  const sess = currentSession();
  const pay = h.match(/^#pay=([\w-]+)\/(invoice|link|product)-(\d+)$/);
  if(pay){
    const owner = pay[1], kind = pay[2], id = parseInt(pay[3],10);
    if(owner === 'guest' && !(sess && sess.guest)){ location.replace(sess ? '#app' : '#login'); return; }
    if(owner !== 'guest'){ const acc = await Store.getAccount(owner); if(!acc){ location.replace('#login'); return; } setMerchantFromAccount(acc); }
    if(!ensureLoaded(owner)){ location.replace('#login'); return; }
    const exists = kind==='invoice' ? invoices.some(i=>i.id===id) : kind==='link' ? paymentLinks.some(l=>l.id===id) : products.some(p=>p.id===id);
    if(!exists){ location.replace(sess ? '#app' : '#login'); return; }
    hideAllShells();
    document.getElementById('shell').style.display = 'none';
    document.getElementById('checkout-page').classList.add('active');
    renderCheckoutCard(kind, id, 'mixx', 'checkout-card');
    return;
  }
  if(h.startsWith('#register')){
    if(sess && !sess.guest){ location.replace(sess.role==='admin' ? '#admin' : '#app'); return; }
    const plan = h.split('/')[1]; pickPlan(['pro','enterprise'].includes(plan) ? plan : 'free');
    showAuth('register'); return;
  }
  if(h==='#forgot'){ document.getElementById('forgot-form-body').classList.remove('hidden'); document.getElementById('forgot-done').classList.add('hidden'); showAuth('forgot'); return; }
  if(h==='#login'){
    if(sess && !sess.guest){ location.replace(sess.role==='admin' ? '#admin' : '#app'); return; }
    showAuth('login'); return;
  }
  if(!sess){ showAuth('login'); if(h!=='#login') history.replaceState(null,'','#login'); return; }
  if(sess.role==='admin'){
    if(!h.startsWith('#admin')) history.replaceState(null,'','#admin');
    hideAllShells(); loadedOwner = null;
    if(typeof showAdmin==='function') showAdmin(h);
    return;
  }
  await showMerchantApp(sess);
  if(h!=='#app') history.replaceState(null,'','#app');
}

/* ---------- sidebar (mobile) ---------- */
function toggleSidebar(){ document.querySelectorAll('.sidebar').forEach(s=> s.closest('.shell').classList.contains('active') && s.classList.toggle('open')); }
function closeSidebar(){ document.querySelectorAll('.sidebar').forEach(s=> s.classList.remove('open')); }

/* ---------- notifications ---------- */
function renderNotifications(){
  const list = document.getElementById('notif-list');
  list.innerHTML = notifications.map((n,i)=>`<div class="notif-item ${n.unread?'unread':''}" onclick="openNotification(${i})"><div class="ni">${n.icon}</div><div><div class="nt"></div><div class="nd"></div></div></div>`).join('') || '<div class="empty-note">You’re all caught up.</div>';
  list.querySelectorAll('.notif-item').forEach((el,i)=>{ el.querySelector('.nt').textContent = T(notifications[i].text); el.querySelector('.nd').textContent = T(notifications[i].when); });
  document.getElementById('notif-dot').style.display = notifications.some(n=>n.unread) ? '' : 'none';
}
function addNotification(icon, text, when){ notifications.unshift({icon, text, when, unread:true, go:'dashboard'}); notifications = notifications.slice(0,20); renderNotifications(); }
function toggleNotif(){ document.getElementById('notif-dropdown').classList.toggle('open'); closeNewMenu(); closeUserMenu(); }
function closeNotif(){ const d = document.getElementById('notif-dropdown'); if(d) d.classList.remove('open'); }
function openNotification(i){ notifications[i].unread = false; renderNotifications(); closeNotif(); showView(notifications[i].go || 'dashboard'); }
function markAllRead(){ notifications.forEach(n=> n.unread=false); renderNotifications(); pushToast('Notifications cleared','All notifications marked as read.'); }

/* ---------- invoice filter ---------- */
function toggleFilterPanel(ev){ ev.stopPropagation(); document.getElementById('filter-panel').classList.toggle('open'); }
function closeFilterPanel(){ const p = document.getElementById('filter-panel'); if(p) p.classList.remove('open'); }
function setInvoiceType(t){ invoiceType = t; renderInvoices(); }
function resetInvoiceFilter(){
  invoiceType = 'all'; document.querySelector('input[name="inv-type"][value="all"]').checked = true;
  document.getElementById('inv-sort').value = 'date'; document.getElementById('inv-search').value = '';
  renderInvoices(); closeFilterPanel(); pushToast('Filters reset','');
}

/* ---------- detailed invoice: discount, extra fields, methods ---------- */
function icDiscountPct(){ return icDiscountOn ? Math.min(100, Math.max(0, parseFloat(document.getElementById('ic-discount').value)||0)) : 0; }
function renderIcTotal(){
  const gross = icDraft.items.reduce((s,i)=>s+i.price*i.qty,0);
  const pct = icDiscountPct();
  document.getElementById('ic-total-display').textContent = fmtMoney(gross - Math.round(gross*pct/100));
  document.getElementById('ic-discount-note').textContent = pct ? T('−'+pct+'% discount') : '';
}
function icFinalItems(){
  const items = icDraft.items.filter(i=> i.label || i.price).map(i=>({...i}));
  if(!items.length) items.push({label:'Item', price:0, qty:1});
  const pct = icDiscountPct();
  if(pct){ const gross = items.reduce((s,i)=>s+i.price*i.qty,0); items.push({label:'Discount '+pct+'%', price:-Math.round(gross*pct/100), qty:1}); }
  return items;
}
let icFields = [];
function resetIcFields(){ icFields = []; renderIcFields(); }
function addIcField(){ icFields.push({name:'', value:''}); renderIcFields(); }
function renderIcFields(){
  const box = document.getElementById('ic-additional-fields');
  if(!icFields.length){ box.style.textAlign='center'; box.textContent = T('There are no additional fields yet.'); return; }
  box.style.textAlign='left';
  box.innerHTML = icFields.map((f,i)=>`<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;">
    <input placeholder="Field name" value="${esc(f.name)}" oninput="icFields[${i}].name=this.value" style="border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-family:inherit;min-width:0;"/>
    <input placeholder="Value" value="${esc(f.value)}" oninput="icFields[${i}].value=this.value" style="border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-family:inherit;min-width:0;"/>
    <button class="item-row-remove" onclick="icFields.splice(${i},1); renderIcFields();">✕</button></div>`).join('');
}
function renderMethods(){
  document.getElementById('methods-tbody').innerHTML = payMethods.map(m=>`<tr>
    <td><strong>${m.name}</strong></td>
    <td>${m.active ? '<span class="pill" style="background:var(--green-soft);color:var(--green);">Active</span>' : '<span class="pill" style="background:var(--surface-2);color:var(--ink-soft);">Not activated</span>'}</td>
    <td class="tabular">${m.fee}</td><td>${m.settle}</td>
    <td>${m.active ? '' : `<button class="activate-pill" data-method="${m.id}" onclick="activateMethod(this,'${m.name}')">Activate</button>`}</td></tr>`).join('');
}
function renderIcMethods(){
  document.querySelectorAll('.payment-methods-card .activate-pill').forEach(btn=>{
    const m = payMethods.find(x=>x.id===btn.dataset.method);
    const on = !!(m && m.active);
    btn.textContent = on ? '✓ Active' : 'Activate'; btn.disabled = on; btn.style.background = on ? 'var(--green)' : '';
  });
}

/* ---------- payment link create ---------- */
function openPaylinkCreate(){
  document.getElementById('pl-title').value = ''; document.getElementById('pl-amount').value = '500';
  document.getElementById('pl-until-field').style.display = 'none'; document.getElementById('pl-until').classList.remove('on');
  resetUpload(document.querySelector('#view-paylink-create input[type=file]'));
  showView('paylink-create');
}

/* ---------- uploads (downscaled so they fit in browser storage) ---------- */
function previewUpload(input){
  const f = input.files && input.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = e => {
    const img = new Image();
    img.onload = () => {
      const max = 480, scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width*scale)); c.height = Math.max(1, Math.round(img.height*scale));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const url = c.toDataURL('image/jpeg', 0.82);
      input.dataset.img = url;
      input.parentElement.querySelector('.dz-inner').innerHTML = `<img class="preview" src="${url}" alt=""><div>${esc(f.name)}</div>`;
      pushToast('Image added', f.name);
    };
    img.onerror = () => pushToast('Check the form','This file is not an image.');
    img.src = e.target.result;
  };
  r.readAsDataURL(f);
}
function resetUpload(input, existing){
  if(!input) return;
  input.value = ''; input.dataset.img = existing || '';
  const inner = input.parentElement.querySelector('.dz-inner');
  const isLogo = input.closest('#view-paylink-create');
  inner.innerHTML = existing ? `<img class="preview" src="${existing}" alt="">` : (isLogo ? T('🖼️ Upload store logo') : `<div style="font-size:26px;">🖼️</div>${T('Drag image here or click to upload')}`);
}

/* ---------- settings ---------- */
function fillSettings(){
  document.getElementById('st-business').value = merchant.name;
  document.getElementById('st-owner').value = merchant.owner;
  document.getElementById('st-email').value = merchant.email;
  document.getElementById('st-phone').value = merchant.phone;
  document.getElementById('st-city').value = merchant.city;
  document.getElementById('st-username').textContent = account ? account.username : T('Guest');
  document.getElementById('st-payout-summary').textContent = T('Wallet '+(payout.wallet||'—')+' · '+(payout.bank||'—'));
  ['st-cur','st-new','st-new2'].forEach(id=>{ const el = document.getElementById(id); el.value=''; fieldError(el,false); });
}
function saveSettings(){
  const em = document.getElementById('st-email').value.trim();
  const patch = { business: document.getElementById('st-business').value.trim() || merchant.name,
                  owner: document.getElementById('st-owner').value.trim(), phone: document.getElementById('st-phone').value.trim(),
                  city: document.getElementById('st-city').value.trim() };
  if(EMAIL_RE.test(em)) patch.email = em;
  if(isGuest()){ Object.assign(merchant, { name:patch.business, owner:patch.owner, phone:patch.phone, city:patch.city, email:patch.email||merchant.email }); applyMerchant(); renderAll(); pushToast('Settings saved','Your changes have been saved.'); return; }
  Store.updateAccount(account.id, patch).then(acc=>{
    setMerchantFromAccount(acc); applyMerchant(); renderAll();
    pushToast('Settings saved','Your changes have been saved.');
  }).catch(e=>{ if(e.code==='email_taken') fieldError(document.getElementById('st-email'), true, 'An account already uses this e-mail.'); });
}
function changeMyPassword(){
  const cur = document.getElementById('st-cur'), n1 = document.getElementById('st-new'), n2 = document.getElementById('st-new2');
  const ok = [fieldError(cur, !cur.value), fieldError(n1, n1.value.length<6), fieldError(n2, n2.value!==n1.value || !n2.value)].every(Boolean);
  if(!ok || !account) return;
  Store.changePassword(account.id, cur.value, n1.value).then(()=>{
    [cur,n1,n2].forEach(el=> el.value=''); pushToast('Password changed','Use your new password next time you log in.');
  }).catch(e=> fieldError(cur, true, e.code==='wrong_password' ? 'Current password is incorrect.' : 'Something went wrong.'));
}
function exportMyData(){
  const blob = new Blob([JSON.stringify({ account, data: snapshot() }, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'mixx-business-' + (account ? account.username : 'guest') + '.json';
  document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 200);
  pushToast('Export ready', 'Your data file was downloaded.');
}
function openPayout(){
  ['wallet','bank','iban','holder'].forEach(k=> document.getElementById('po-'+k).value = payout[k] || '');
  openOverlay('payout-overlay');
}
function savePayout(){
  ['wallet','bank','iban','holder'].forEach(k=> payout[k] = document.getElementById('po-'+k).value.trim());
  persistSoon(); closeOverlay('payout-overlay'); fillSettings();
  pushToast('Payout account saved','Your changes have been saved.');
}

/* ---------- plans ---------- */
function openUpgrade(){ applyMerchant(); openOverlay('upgrade-overlay'); }
function choosePlan(p){
  closeOverlay('upgrade-overlay');
  if(isGuest()){ pushToast('Create an account first','Plans apply to registered accounts.'); location.hash = '#register/'+p; return; }
  Store.updateAccount(account.id, { plan:p }).then(acc=>{
    setMerchantFromAccount(acc); applyMerchant();
    pushToast('Plan updated', 'You are now on the '+(p==='pro'?'Professional':'Free')+' plan.');
  });
}
function goRegisterFromGuest(){ Store.session.clear(); Store.clearGuest(); loadedOwner = null; location.hash = '#register'; }

/* ---------- POS extras ---------- */
let posClientId = null;
function renderPosStats(){
  document.getElementById('pos-total-sales').textContent = fmtMoney(posStats.sales);
  document.getElementById('pos-total-orders').textContent = posStats.orders;
  document.getElementById('pos-cashier-name').textContent = posSettings.cashier || 'Cashier';
}
function openPosSettings(){ document.getElementById('ps-cashier').value = posSettings.cashier; document.getElementById('ps-footer').value = posSettings.footer; openOverlay('pos-settings-overlay'); }
function savePosSettings(){
  posSettings.cashier = document.getElementById('ps-cashier').value.trim() || posSettings.cashier;
  posSettings.footer = document.getElementById('ps-footer').value.trim();
  renderPosStats(); closeOverlay('pos-settings-overlay'); pushToast('Settings saved','Your changes have been saved.');
}
function openPosClientPicker(){
  document.getElementById('pos-client-list').innerHTML = `<div class="picker-row" onclick="posPickClient(0)">🚶 <span>Walk-in customer</span></div>` + clients.map(c=>`<div class="picker-row" onclick="posPickClient(${c.id})"><span class="avatar avatar-sm" style="background:${avatarColor(c.id)};">${esc(initials(c.name)[0])}</span>${esc(c.name)}</div>`).join('');
  openOverlay('pos-client-overlay');
}
function posPickClient(id){
  posClientId = id || null;
  document.getElementById('pos-client-btn').textContent = id ? '👤 '+clientById(id).name : '+ Add a client';
  closeOverlay('pos-client-overlay');
  if(id) pushToast('Client selected', clientById(id).name+' added to this order.');
}
function renderTxHistory(){
  const box = document.getElementById('tx-history'); if(!box) return;
  box.innerHTML = transactions.slice(0,8).map(t=>`<div class="tx-row"><div class="tx-ic">${t.pos?'🧾':'💳'}</div><div style="flex:1;"><div style="font-weight:700;">${esc(t.label)}</div><div style="font-size:11.5px;color:var(--muted);">${fmtDateTime(t.time)} · ${T(t.method)}</div></div><div class="tabular" style="font-weight:800;">${fmtMoney(t.amount)}</div></div>`).join('') || '<div class="empty-note">No transactions yet today.</div>';
}

/* ---------- reports export ---------- */
function exportReportCsv(){
  const rows = [['Invoice','Client','Date','Amount (XOF)','Status']].concat(invoices.map(i=>[i.num, clientById(i.clientId).name, i.date, invoiceTotal(i), i.status]));
  const csv = '﻿' + rows.map(r=> r.map(v=> '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = 'invoices.csv';
  document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 200);
  pushToast('Export ready','invoices.csv was downloaded.');
}

/* ---------- init ---------- */
function renderAll(){
  if(!loadedOwner) return;
  renderDashboard();
  renderInvoices();
  renderPaylinks();
  renderProducts();
  renderClients();
  renderReports();
  renderMethods();
  renderNotifications();
  renderPosStats();
  renderTxHistory();
  if(document.getElementById('pos-sell-page').style.display==='flex'){ renderPosCatPills(); renderPosProducts(''); renderPosOrder(); renderPosMethodTabs(); }
  const h = location.hash.match(/^#pay=([\w-]+)\/(invoice|link|product)-(\d+)$/);
  if(h && document.getElementById('checkout-page').classList.contains('active')) renderCheckoutCard(h[2], parseInt(h[3],10), checkoutMethod, 'checkout-card');
  applyMerchant();
}
function appLangChanged(){ if(loadedOwner) renderAll(); if(typeof renderAdmin==='function') renderAdmin(); }
setAppTheme(lsGet('mbl_theme','blue'));
document.addEventListener('DOMContentLoaded', ()=>{
  startI18n();
  route();
  window.addEventListener('hashchange', route);
});
