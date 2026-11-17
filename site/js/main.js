/* =============================================
   MIXX BUSINESS LITE — main.js
   Shared nav, footer, mobile menu, FAQ, forms
   ============================================= */

/* ── Path helpers ── */
function rootPath() {
  // Detect if we're inside /features/ subfolder
  const path = window.location.pathname;
  return path.includes('/features/') ? '../' : './';
}

/* ── Mixx logo (colour follows the theme: yellow on Blue, blue on White) ── */
const MIXX_LOGO = `<svg class="mixx-logo" viewBox="0 0 116 37" role="img" aria-label="Mixx" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M64.5495 0H52.8869L51.1008 8.39339H63.6631L64.5495 0Z"/><path d="M115.364 10.6557H105.325L105.122 11.0272C102.934 15.0216 101.351 17.0453 100.405 17.0453C100.262 17.0453 99.0038 16.8727 98.1705 11.2528L98.0809 10.6557H82.4942L82.2917 11.0206C80.1039 15.0182 78.517 17.0419 77.5709 17.0419C77.4281 17.0419 76.1699 16.8694 75.3333 11.2495L75.2437 10.6523H64.7364L64.9522 11.5215C66.0212 15.7979 67.7541 20.3595 69.6066 23.7666C66.5855 27.6116 63.8765 31.6955 61.5593 35.9088L60.9883 36.9472H71.0275L71.2267 36.5823C73.4144 32.5846 75.0013 30.5576 75.9475 30.5576C76.0902 30.5576 77.3485 30.7334 78.1817 36.3501L78.2714 36.9472H93.858L94.0572 36.5823C96.245 32.5846 97.8319 30.5576 98.778 30.5576C98.9208 30.5576 100.182 30.7334 101.016 36.3501L101.105 36.9472H111.613L111.397 36.078C110.328 31.805 108.595 27.2434 106.746 23.833C109.77 19.9846 112.476 15.9007 114.793 11.6907L115.364 10.6557ZM92.4405 23.7732C90.5581 26.1685 88.7754 28.6965 87.1287 31.2941C86.1826 28.5605 85.0505 25.9396 83.9118 23.8396C85.7941 21.4476 87.5769 18.9197 89.2202 16.3187C90.173 19.0524 91.3018 21.6732 92.4405 23.7732Z"/><path d="M44.8809 2.40821C44.2103 1.76129 43.3903 1.23711 42.4575 0.855595C41.2689 0.334741 40.0074 0.0693359 38.6961 0.0693359L38.3209 0.0792882C38.1981 0.0759706 38.0885 0.0660191 37.9591 0.0726542C36.4319 0.0394787 34.8218 0.45749 33.3246 1.29683C32.0232 1.98356 30.8546 2.95892 29.9516 4.10679C29.9118 4.15323 29.8719 4.19968 29.8321 4.24944C28.0958 1.62526 25.2175 0.0693359 22.0437 0.0693359L21.6752 0.0826064C20.7955 0.0593836 19.9423 0.142322 19.1356 0.318152C18.787 0.404408 18.4085 0.533794 18.0267 0.702988C16.5594 1.22716 15.2182 2.07977 14.1193 3.18451L12.8079 0.0759724H5.25863L5.22211 0.314836C4.35563 5.9613 3.47587 12.3642 2.62268 18.5547C1.78276 24.6656 0.912957 30.9856 0.0497981 36.632L0 36.9538H10.5173L13.0669 17.941C13.6445 15.0414 14.2421 12.0424 16.5793 10.2111C17.2897 9.53098 18.611 9.23572 19.4941 9.93572C20.4602 10.785 20.3506 12.0191 20.2112 13.5817L17.0905 36.9538H27.1696L29.779 17.4699C30.3765 14.7462 30.9907 11.9296 33.1586 10.2509C33.9852 9.55752 35.2335 9.19259 36.1498 9.93572C37.0893 10.7386 36.993 11.986 36.8868 13.4158L33.7462 36.9505H43.968L47.9252 10.785C48.4033 7.65325 47.2646 4.51817 44.8809 2.40821Z"/><path d="M51.5472 10.6553L47.5103 36.9535H58.7811L62.8214 10.6553H51.5472Z"/></svg>`;

/* ── SVG Icons ── */
const icons = {
  chevron: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  arrow: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  check: `<svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
  x: `<svg width="10" height="10" viewBox="0 0 24 24" fill="#9CA3AF" stroke="none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  globe: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  star: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
};

/* ── Nav feature items ── */
const featureLinks = [
  { key: 'nav_invoices',      href: 'invoices.html',      icon: '🧾' },
  { key: 'nav_payment_links', href: 'payment-links.html', icon: '🔗' },
  { key: 'nav_store',         href: 'online-store.html',  icon: '🛍️' },
  { key: 'nav_gateway',       href: 'payment-gateway.html', icon: '💳' },
  { key: 'nav_cashier',       href: 'cashier-pos.html',   icon: '🏪' },
  { key: 'nav_integration',   href: 'integration.html',   icon: '🔌' },
  { key: 'nav_bio',           href: 'bio-page.html',      icon: '👤' },
  { key: 'nav_ai',            href: 'ai-tools.html',      icon: '🤖' },
];

const aboutLinks = [
  { key: 'nav_about_us',  href: 'about.html' },
  { key: 'nav_pricing',   href: 'pricing.html' },
  { key: 'nav_faq',       href: 'faq.html' },
  { key: 'nav_help',      href: 'help.html' },
  { key: 'nav_blog',      href: 'blog.html' },
  { key: 'nav_agency',    href: 'partners.html#agency' },
];

/* ── Theme (Blue / White) ── */
function getTheme() { try { return localStorage.getItem('mbl_theme') || 'blue'; } catch (e) { return 'blue'; } }
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('mbl_theme', theme); } catch (e) {}
  document.querySelectorAll('[data-theme-btn]').forEach(b => b.classList.toggle('active', b.getAttribute('data-theme-btn') === theme));
}
function themeSwitchHTML() {
  return `<div class="theme-switch" role="group" aria-label="Colour theme">
    <button type="button" data-theme-btn="blue" onclick="setTheme('blue')" title="${t('theme_blue')}"><span class="sw"></span><span class="lbl" data-i18n="theme_blue">${t('theme_blue')}</span></button>
    <button type="button" data-theme-btn="white" onclick="setTheme('white')" title="${t('theme_white')}"><span class="sw"></span><span class="lbl" data-i18n="theme_white">${t('theme_white')}</span></button>
  </div>`;
}

/* ── Toast (site) ── */
function siteToast(msg) {
  let el = document.getElementById('siteToast');
  if (!el) { el = document.createElement('div'); el.id = 'siteToast'; el.className = 'toast-site'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ── Build shared nav ── */
function buildNav() {
  const r = rootPath();
  const featLinksHTML = featureLinks.map(f => `
    <a href="${r}features/${f.href}">
      <span class="dd-icon">${f.icon}</span>
      <span data-i18n="${f.key}">${t(f.key)}</span>
    </a>`).join('');

  const aboutLinksHTML = aboutLinks.map(a => `
    <a href="${r}${a.href}"><span data-i18n="${a.key}">${t(a.key)}</span></a>`).join('');

  const navHTML = `
<nav class="nav">
  <div class="container">
    <div class="nav-inner">
      <a href="${r}index.html" class="nav-logo">
        <div class="logo-mark">${MIXX_LOGO}</div>
        <div class="logo-sub">Business Lite</div>
      </a>

      <div class="nav-links">
        <div class="nav-item">
          <a class="nav-link" href="${r}index.html#features">
            <span data-i18n="nav_features">${t('nav_features')}</span>
            ${icons.chevron}
          </a>
          <div class="nav-dropdown">${featLinksHTML}</div>
        </div>
        <div class="nav-item">
          <a class="nav-link" href="${r}about.html">
            <span data-i18n="nav_about">${t('nav_about')}</span>
            ${icons.chevron}
          </a>
          <div class="nav-dropdown">${aboutLinksHTML}</div>
        </div>
        <a class="nav-link" href="${r}contact.html" data-i18n="nav_contact">${t('nav_contact')}</a>
      </div>

      <div class="nav-actions">
        ${themeSwitchHTML()}
        <button class="nav-lang lang-btn" data-lang="en" onclick="setLang('en')" title="English">EN</button>
        <span style="color:var(--border);font-size:0.8rem;">|</span>
        <button class="nav-lang lang-btn" data-lang="fr" onclick="setLang('fr')" title="Français">FR</button>
        <a href="${r}app/index.html#login" class="btn btn-outline btn-sm" data-i18n="nav_login">${t('nav_login')}</a>
        <a href="${r}app/index.html#register" class="btn btn-primary btn-sm" data-i18n="nav_start">${t('nav_start')}</a>
      </div>

      <button class="nav-hamburger" id="hamburger" onclick="toggleMenu()" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>

<!-- Mobile Menu -->
<div class="nav-mobile-menu" id="mobileMenu">
  <div class="nav-mobile-section" data-i18n="nav_features">${t('nav_features')}</div>
  ${featureLinks.map(f => `<a class="nav-mobile-link" href="${r}features/${f.href}">${f.icon} <span data-i18n="${f.key}">${t(f.key)}</span></a>`).join('')}
  <div class="nav-mobile-section" data-i18n="nav_about">${t('nav_about')}</div>
  ${aboutLinks.map(a => `<a class="nav-mobile-link" href="${r}${a.href}" data-i18n="${a.key}">${t(a.key)}</a>`).join('')}
  <a class="nav-mobile-link" href="${r}contact.html" data-i18n="nav_contact">${t('nav_contact')}</a>
  <div style="display:flex;gap:10px;padding:16px 8px 8px;">
    <button class="nav-lang lang-btn" data-lang="en" onclick="setLang('en');closeMenu()">EN</button>
    <button class="nav-lang lang-btn" data-lang="fr" onclick="setLang('fr');closeMenu()">FR</button>
  </div>
  ${themeSwitchHTML()}
  <a href="${r}app/index.html#login" class="btn btn-outline" style="margin:12px 0 0;justify-content:center" data-i18n="nav_login">${t('nav_login')}</a>
  <a href="${r}app/index.html#register" class="btn btn-primary" style="margin:8px 0;justify-content:center" data-i18n="nav_start">${t('nav_start')}</a>
</div>`;

  const placeholder = document.getElementById('nav-placeholder');
  if (placeholder) {
    placeholder.outerHTML = navHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }
}

/* ── Build shared footer ── */
function buildFooter() {
  const r = rootPath();
  const footerHTML = `
<footer class="footer">
  <div class="footer-top">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="${r}index.html" style="text-decoration:none">
            <div class="logo-mark">${MIXX_LOGO}</div>
            <div class="footer-logo-sub">Business Lite</div>
          </a>
          <p class="footer-tagline" data-i18n="footer_tagline">${t('footer_tagline')}</p>
          <div class="footer-socials">
            <a href="https://www.facebook.com/mixxsn" target="_blank" rel="noopener" class="footer-social" title="Facebook — Mixx Sénégal">f</a>
            <a href="https://www.instagram.com/mixxsenegal/" target="_blank" rel="noopener" class="footer-social" title="Instagram — Mixx Sénégal">IG</a>
            <a href="https://www.yas.sn/mixx-by-yas/" target="_blank" rel="noopener" class="footer-social" title="Mixx by Yas — Sénégal">SN</a>
            <a href="https://yas.tg/mixx-by-yas/" target="_blank" rel="noopener" class="footer-social" title="Mixx by Yas — Togo">TG</a>
            <a href="https://mixx.co.tz/" target="_blank" rel="noopener" class="footer-social" title="Mixx by Yas — Tanzania">TZ</a>
          </div>
        </div>

        <div class="footer-col">
          <h4 data-i18n="footer_tools">${t('footer_tools')}</h4>
          <div class="footer-links">
            <a href="${r}features/invoices.html" data-i18n="nav_invoices">${t('nav_invoices')}</a>
            <a href="${r}features/payment-links.html" data-i18n="nav_payment_links">${t('nav_payment_links')}</a>
            <a href="${r}features/cashier-pos.html" data-i18n="nav_cashier">${t('nav_cashier')}</a>
            <a href="${r}features/online-store.html" data-i18n="nav_store">${t('nav_store')}</a>
            <a href="${r}features/payment-gateway.html" data-i18n="nav_gateway">${t('nav_gateway')}</a>
            <a href="${r}features/integration.html" data-i18n="nav_integration">${t('nav_integration')}</a>
            <a href="${r}features/bio-page.html" data-i18n="nav_bio">${t('nav_bio')}</a>
            <a href="${r}features/ai-tools.html" data-i18n="nav_ai">${t('nav_ai')}</a>
          </div>
        </div>

        <div class="footer-col">
          <h4 data-i18n="footer_company">${t('footer_company')}</h4>
          <div class="footer-links">
            <a href="${r}about.html" data-i18n="nav_about_us">${t('nav_about_us')}</a>
            <a href="${r}pricing.html" data-i18n="nav_pricing">${t('nav_pricing')}</a>
            <a href="${r}security.html" data-i18n="footer_security">${t('footer_security')}</a>
            <a href="${r}partners.html#affiliate" data-i18n="footer_affiliate">${t('footer_affiliate')}</a>
            <a href="${r}careers.html" data-i18n="footer_jobs">${t('footer_jobs')}</a>
            <a href="${r}features/ai-tools.html" data-i18n="footer_free_tools">${t('footer_free_tools')}</a>
            <a href="${r}partners.html#agency" data-i18n="nav_agency">${t('nav_agency')}</a>
          </div>
        </div>

        <div class="footer-col">
          <h4 data-i18n="footer_support">${t('footer_support')}</h4>
          <div class="footer-links">
            <a href="${r}app/index.html#login" data-i18n="footer_merchant_login">${t('footer_merchant_login')}</a>
            <a href="${r}contact.html" data-i18n="nav_contact">${t('nav_contact')}</a>
            <a href="${r}faq.html" data-i18n="nav_faq">${t('nav_faq')}</a>
            <a href="${r}help.html" data-i18n="nav_help">${t('nav_help')}</a>
            <a href="${r}features/integration.html" data-i18n="footer_dev_api">${t('footer_dev_api')}</a>
            <a href="${r}blog.html#academy" data-i18n="footer_academy">${t('footer_academy')}</a>
            <a href="${r}legal.html#terms" data-i18n="footer_terms">${t('footer_terms')}</a>
            <a href="${r}legal.html#privacy" data-i18n="footer_privacy">${t('footer_privacy')}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <span class="footer-copy" data-i18n="footer_copy">${t('footer_copy')}</span>
      <div class="footer-legal">
        <a href="${r}legal.html#terms" data-i18n="footer_terms">${t('footer_terms')}</a>
        <a href="${r}legal.html#privacy" data-i18n="footer_privacy">${t('footer_privacy')}</a>
      </div>
    </div>
  </div>
</footer>`;

  const placeholder = document.getElementById('footer-placeholder');
  if (placeholder) placeholder.outerHTML = footerHTML;
}

/* ── Mobile menu ── */
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const btn = document.getElementById('hamburger');
  if (!menu || !btn) return;
  const isOpen = menu.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}
function closeMenu() {
  const menu = document.getElementById('mobileMenu');
  const btn = document.getElementById('hamburger');
  if (menu) menu.classList.remove('open');
  if (btn)  btn.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── FAQ accordion ── */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

/* ── Scroll animations ── */
function initAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.feature-card, .why-card, .testimonial-card, .pricing-card, .benefit-row').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

/* ── Active nav link ── */
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.href && path.includes(link.getAttribute('href')?.split('/').pop())) {
      link.classList.add('active');
    }
  });
}

/* ── Contact form ── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const success = document.getElementById('formSuccess');
    if (success) {
      success.style.display = 'block';
      form.reset();
      setTimeout(() => { success.style.display = 'none'; }, 5000);
    }
  });
}

/* ── Stars renderer ── */
function stars(n = 5) {
  return Array(n).fill(`<svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD100"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`).join('');
}

/* ── Open FAQ item from #hash (e.g. faq.html#why-free) ── */
function openFaqFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const el = document.getElementById(id);
  if (el && el.classList.contains('faq-item')) {
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    el.classList.add('open');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  }
}

/* ── Newsletter / generic demo forms ── */
function initDemoForms() {
  document.querySelectorAll('form[data-demo-form]').forEach(f => {
    f.addEventListener('submit', e => { e.preventDefault(); siteToast(t(f.getAttribute('data-demo-form'))); f.reset(); });
  });
}

/* ── Back button on every inner page ── */
function addBackButton() {
  const hero = document.querySelector('.page-hero .container, .about-hero .container, .contact-hero .container, .faq-hero .container, .pricing-hero .container');
  if (!hero || hero.querySelector('.back-link')) return;
  const r = rootPath();
  const a = document.createElement('a');
  a.className = 'back-link'; a.href = r + 'index.html';
  a.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg><span data-i18n="back">${t('back')}</span>`;
  a.addEventListener('click', e => {
    const ref = document.referrer || '';
    if (ref && ref.split('#')[0] !== location.href.split('#')[0] && (ref.startsWith('file:') || ref.indexOf(location.host) > -1) && history.length > 1) { e.preventDefault(); history.back(); }
  });
  hero.insertBefore(a, hero.firstChild);
}

/* ── Nav dropdowns: hover on desktop, tap/keyboard everywhere ── */
function initDropdowns() {
  document.querySelectorAll('.nav .nav-item').forEach(item => {
    const link = item.querySelector('.nav-link'); const dd = item.querySelector('.nav-dropdown');
    if (!link || !dd) return;
    let hideT;
    item.addEventListener('mouseenter', () => { clearTimeout(hideT); document.querySelectorAll('.nav .nav-item.open').forEach(o => o !== item && o.classList.remove('open')); item.classList.add('open'); });
    item.addEventListener('mouseleave', () => { hideT = setTimeout(() => item.classList.remove('open'), 250); });
    link.addEventListener('click', e => {
      if (!item.classList.contains('open') || matchMedia('(hover: none)').matches) { e.preventDefault(); item.classList.toggle('open'); }
    });
  });
  document.addEventListener('click', e => { if (!e.target.closest('.nav .nav-item')) document.querySelectorAll('.nav .nav-item.open').forEach(o => o.classList.remove('open')); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.nav .nav-item.open').forEach(o => o.classList.remove('open')); });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  buildFooter();
  applyTranslations();
  setTheme(getTheme());
  addBackButton();
  initDropdowns();
  const psl = document.getElementById('paystrip-logo'); if (psl) psl.innerHTML = MIXX_LOGO;
  openFaqFromHash();
  window.addEventListener('hashchange', openFaqFromHash);
  initDemoForms();
  setActiveNav();
  initFAQ();
  initAnimations();
  initContactForm();

  // Render any star elements
  document.querySelectorAll('.stars-5').forEach(el => { el.innerHTML = stars(5); });
});
