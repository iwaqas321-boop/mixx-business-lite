/* =============================================
   Feature page template builder
   Called by each feature page with its config
============================================= */

function buildFeaturePage(config) {
  /* config: {
      badge, h1, sub,        — hero text keys
      sections: [{           — benefit rows
        h, p, checks,        — i18n keys
        illustrationFn,      — function returning SVG string
        reverse              — bool (alternates layout)
      }],
      otherFeatures          — array of {title, href, icon} for bottom grid
  } */

  // Build sections
  const sectionsHTML = config.sections.map((sec, i) => `
    <div class="benefit-row ${sec.reverse ? 'reverse' : ''}" style="padding:64px 0;">
      <div class="benefit-text">
        <div class="label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
          Mixx Business Lite
        </div>
        <h2 data-i18n="${sec.h}">${t(sec.h)}</h2>
        <p data-i18n="${sec.p}">${t(sec.p)}</p>
        <ul class="benefit-checklist">
          ${sec.checks.map(c => `<li data-i18n="${c}">${t(c)}</li>`).join('')}
        </ul>
        <a href="${rootPath()}app/index.html#register" class="btn btn-primary" data-i18n="feat_section_cta">${t('feat_section_cta')}</a>
      </div>
      <div class="benefit-visual">
        ${sec.illustrationFn()}
      </div>
    </div>
  `).join('');

  return `
<section class="section">
  <div class="container">
    ${sectionsHTML}
  </div>
</section>`;
}
