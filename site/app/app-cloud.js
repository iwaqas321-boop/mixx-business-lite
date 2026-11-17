/* =====================================================================
   Mixx Business Lite — cloud glue (Stage 2)
   Small hooks between app.js and the Supabase-backed Store:
   - checkout pages opened by customers record the payment on the server
   - the merchant's screen refreshes when a payment arrives from elsewhere
   ===================================================================== */
(function () {
  const METHOD_NAMES = { mixx: 'Mixx Wallet', card: 'Card', paypal: 'PayPal', bank: 'Bank transfer' };

  /* A customer paying someone else's invoice / link / product: the payment is
     recorded by /api/checkout first, then the usual success screen runs. */
  const confirmLocal = window.checkoutConfirm;
  window.checkoutConfirm = function (kind, id, containerId, via) {
    if (!loadedOwner || loadedOwner === 'guest' || Store.isMine(loadedOwner)) return confirmLocal.apply(this, arguments);
    const args = arguments;
    const method = via === 'qr' ? 'Mixx Wallet' : METHOD_NAMES[checkoutMethod] || 'Mixx Wallet';
    const card = document.getElementById(containerId || 'checkout-card');
    card.querySelectorAll('button').forEach(b => { b.disabled = true; });
    Store.payCheckout(loadedOwner, kind, id, method, via)
      .then(() => confirmLocal.apply(this, args))
      .catch(e => {
        card.querySelectorAll('button').forEach(b => { b.disabled = false; });
        if (e.code === 'already_paid') pushToast('Already paid', 'This has already been paid — nothing was charged.');
        else pushToast('Payment failed', 'Nothing was charged. Please try again.');
      });
  };

  /* Store tells us the merchant's workspace changed on the server */
  Store.onRemoteChange = function (owner, lostLocal) {
    if (loadedOwner !== owner) return;
    loadedOwner = null;
    if (!ensureLoaded(owner)) { location.replace('#login'); return; }
    if (lostLocal) pushToast('Updated with new activity', 'A payment arrived while you were editing — please check your last change.');
    else pushToast('New activity', 'Your dashboard was updated with a new payment.');
  };

  /* A password-reset link pasted into a tab that already has the app open only
     changes the hash, so reload to let Store.ready read the link's tokens. */
  window.addEventListener('hashchange', () => {
    if (/(^|[#&])(access_token=|error_code=)/.test(location.hash)) location.reload();
  });

  let saveWarned = false;
  Store.onSaveError = function () {
    if (saveWarned) return; saveWarned = true;
    pushToast('Connection problem', 'Your last change is not saved yet — retrying…');
    setTimeout(() => { saveWarned = false; }, 15000);
  };
})();
