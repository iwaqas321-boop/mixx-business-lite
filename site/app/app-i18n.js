/* =====================================================================
   Mixx Business Lite — Dashboard EN/FR
   English is the source text. Every visible text node, placeholder and
   title is looked up in FR below (exact match, then patterns). A
   MutationObserver translates anything the app renders later, so new
   screens only need their English strings added here.
   Language is shared with the website through localStorage 'mbl_lang'.
   ===================================================================== */
const FR = {
  // ---- auth
  'Mixx Business Lite website': 'Site Mixx Business Lite',
  '← Back to website': '← Retour au site',
  'Blue': 'Bleu', 'White': 'Blanc',
  'Log in to Mixx Business Lite': 'Connexion à Mixx Business Lite',
  'Welcome back — manage invoices, links, store and cashier.': 'Bon retour — gérez factures, liens, boutique et caisse.',
  'or': 'ou',
  'E-mail': 'E-mail', 'you@business.com': 'vous@entreprise.com',
  'Enter a valid e-mail address.': 'Saisissez une adresse e-mail valide.',
  'Password': 'Mot de passe',
  'Password must be at least 6 characters.': 'Le mot de passe doit contenir au moins 6 caractères.',
  'Remember me': 'Se souvenir de moi', 'Forgot password?': 'Mot de passe oublié ?',
  'Log in': 'Se connecter', "Don't have an account?": 'Pas encore de compte ?', 'Register': "S'inscrire",
  'Demo account is pre-filled — just press Log in.': 'Le compte démo est pré-rempli — cliquez simplement sur Se connecter.',
  'Create your free account': 'Créez votre compte gratuit',
  'Start collecting payments in minutes. No card required.': 'Encaissez vos premiers paiements en quelques minutes. Sans carte bancaire.',
  'Free': 'Gratuit', '0 XOF / month': '0 XOF / mois', 'Professional': 'Professionnel', '$17 / month': '17 $ / mois',
  'Enterprise': 'Entreprise', 'Custom': 'Sur mesure',
  'Full name': 'Nom complet', 'Please enter your name.': 'Veuillez saisir votre nom.',
  'Business name': "Nom de l'entreprise", 'Please enter your business name.': "Veuillez saisir le nom de l'entreprise.",
  'Mixx number': 'Numéro Mixx', 'Enter your phone number.': 'Saisissez votre numéro de téléphone.',
  'Country': 'Pays', 'Senegal': 'Sénégal', 'Togo': 'Togo', 'Tanzania': 'Tanzanie',
  'At least 6 characters': 'Au moins 6 caractères',
  'I agree to the': "J'accepte les", 'Terms of Use': "Conditions d'utilisation",
  'Please accept the Terms of Use.': "Veuillez accepter les conditions d'utilisation.",
  'Create account': 'Créer mon compte', 'Already have an account?': 'Vous avez déjà un compte ?',
  'Reset your password': 'Réinitialiser le mot de passe',
  'Choose a new password': 'Choisissez un nouveau mot de passe', 'Pick a new password for your account.': 'Choisissez un nouveau mot de passe pour votre compte.', 'Save new password': 'Enregistrer le mot de passe', 'Password updated': 'Mot de passe mis à jour', 'You can now log in with your new password.': 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.', 'Reset link expired': 'Lien expiré', 'Please ask for a new reset link.': 'Demandez un nouveau lien de réinitialisation.', 'That link is no longer valid — ask for a new one below.': 'Ce lien n\x27est plus valide — demandez-en un nouveau ci-dessous.', 'Choose a password different from your old one.': 'Choisissez un mot de passe différent de l\x27ancien.', 'Too many requests': 'Trop de demandes', 'Please wait a while before asking for another reset link.': 'Patientez avant de demander un nouveau lien.', 'Could not send the e-mail': 'Impossible d\x27envoyer l\x27e-mail',
  "Enter your e-mail and we'll send you a reset link.": 'Saisissez votre e-mail, nous vous enverrons un lien de réinitialisation.',
  'Send reset link': 'Envoyer le lien', 'Check your inbox': 'Consultez votre boîte mail',
  'If an account exists for that e-mail, a reset link is on its way.': 'Si un compte existe pour cet e-mail, un lien de réinitialisation arrive.',
  '← Back to log in': '← Retour à la connexion',
  // ---- shell
  'Menu': 'Menu', 'New': 'Nouveau',
  '⚡ Express Invoice': '⚡ Facture express', '📄 Detailed Invoice': '📄 Facture détaillée',
  '🔗 Payment Link': '🔗 Lien de paiement', '📦 New Product': '📦 Nouveau produit', '👤 New Client': '👤 Nouveau client',
  '🌐 Website': '🌐 Site web', 'Upgrade': 'Passer Pro', 'Notifications': 'Notifications',
  'Mark all as read': 'Tout marquer comme lu', 'Account settings': 'Paramètres du compte', 'Plans & billing': 'Forfaits et facturation',
  'Help Center': "Centre d'aide", 'Log out': 'Se déconnecter',
  'Dashboard': 'Tableau de bord', 'Invoices': 'Factures', 'Payment links': 'Liens de paiement', 'Online Store': 'Boutique en ligne',
  'Cashier (POS)': 'Caisse (TPE)', 'Products': 'Produits', 'Integration': 'Intégration', 'Clients': 'Clients', 'Reports': 'Rapports',
  'Free plan': 'Forfait Gratuit', 'Professional plan': 'Forfait Professionnel', 'Enterprise plan': 'Forfait Entreprise',
  '7 of 10 invoices used this month': '7 factures sur 10 utilisées ce mois-ci',
  'Unlimited invoices and products': 'Factures et produits illimités',
  'Settings': 'Paramètres', 'Back to website': 'Retour au site',
  // ---- dashboard
  'Total revenue': 'Chiffre d’affaires', 'Active invoices': 'Factures actives', 'Paid invoices': 'Factures payées',
  '📋 Recent invoices': '📋 Factures récentes', 'View all': 'Tout voir',
  // ---- invoices
  '+ Add Invoice': '+ Nouvelle facture', 'Active': 'Active', 'Paid': 'Payée', 'Draft': 'Brouillon',
  '⚙ Filter': '⚙ Filtrer', 'Invoice type': 'Type de facture', 'All types': 'Tous les types', '⚡ Express': '⚡ Express', '📋 Detailed': '📋 Détaillée',
  'Sort by': 'Trier par', 'Newest first': 'Plus récentes', 'Highest amount': 'Montant le plus élevé', 'Reset filters': 'Réinitialiser',
  '🔍 Search invoices...': '🔍 Rechercher une facture...', 'Invoice Number': 'N° de facture', 'Client': 'Client', 'Date': 'Date',
  'Invoice value (XOF)': 'Montant (XOF)', 'Status': 'Statut', 'View': 'Voir', 'No invoices here.': 'Aucune facture ici.',
  '‹ List of invoices': '‹ Liste des factures', '📄 Detailed': '📄 Détaillée', '+ Create invoice': '+ Créer la facture',
  'From:': 'De :', 'To:': 'À :', 'Description': 'Description', 'Price': 'Prix', 'Quantity': 'Quantité', 'Total (XOF)': 'Total (XOF)',
  '+ Add item to invoice': '+ Ajouter une ligne', 'Total': 'Total', 'Additional fields': 'Champs supplémentaires',
  'There are no additional fields yet.': "Aucun champ supplémentaire pour l'instant.", '+ Add field': '+ Ajouter un champ',
  'Field name': 'Nom du champ', 'Value': 'Valeur', 'e.g. PO number': 'ex. N° de bon de commande',
  'Add discount': 'Ajouter une remise', 'Discount (%)': 'Remise (%)', 'Invoice Language': 'Langue de la facture',
  '💳 Payment methods': '💳 Moyens de paiement', 'Credit Card': 'Carte bancaire', 'Activate': 'Activer', '✓ Active': '✓ Active',
  'Bank transfer': 'Virement bancaire', 'Edit Payment Detail': 'Modifier les coordonnées de paiement',
  'Write or select a product ...': 'Saisissez ou choisissez un produit...', '+ Add new client…': '+ Nouveau client…', 'Item': 'Article',
  // ---- payment links
  '+ New link': '+ Nouveau lien', 'Title': 'Titre', 'Amount': 'Montant', 'Type': 'Type', 'Collected': 'Encaissé',
  'Any amount': 'Montant libre', 'Reusable': 'Réutilisable', 'One-time': 'Unique', 'No payment links yet.': 'Aucun lien de paiement.',
  '‹ Payment links': '‹ Liens de paiement', 'Create a payment link': 'Créer un lien de paiement', '🖼️ Upload store logo': '🖼️ Importer le logo',
  'Payment link title': 'Titre du lien', 'Payment for Cake': 'Paiement gâteau', 'Requested amount': 'Montant demandé',
  'Repeated amount': 'Montant récurrent', 'Enable the quantity field': 'Activer le champ quantité',
  'Payment link will be sold until': "Lien disponible jusqu'au", 'Sold until': "Disponible jusqu'au", 'Currency': 'Devise',
  'Payment methods': 'Moyens de paiement', 'Cash on Delivery': 'Paiement à la livraison', 'Card, credit/debit': 'Carte de crédit/débit',
  'Create the link 🔗': 'Créer le lien 🔗',
  // ---- store & products
  'Online store': 'Boutique en ligne', 'Preview storefront': 'Aperçu de la boutique', '+ Add product': '+ Ajouter un produit',
  'No published products yet.': 'Aucun produit publié.', 'Buy now': 'Acheter', 'Storefront preview': 'Aperçu de la boutique',
  '+ Add Product': '+ Ajouter un produit', 'Name': 'Nom', 'Price (XOF)': 'Prix (XOF)', 'Published': 'Publié', 'Edit': 'Modifier',
  '‹ Products': '‹ Produits', 'New Product': 'Nouveau produit', 'Edit Product': 'Modifier le produit', 'Add product': 'Ajouter le produit',
  'Save product': 'Enregistrer', 'Product name': 'Nom du produit', 'e.g. Sac à main cuir': 'ex. Sac à main cuir',
  'Sell price (XOF)': 'Prix de vente (XOF)', 'SKU / Barcode': 'Référence / Code-barres', 'Is quantity limited?': 'Quantité limitée ?',
  'Show this product has variants?': 'Ce produit a-t-il des variantes ?', 'Product details': 'Détails du produit',
  'Describe the product...': 'Décrivez le produit...', 'Publish online': 'Publier en ligne',
  'Drag image here or click to upload': 'Glissez une image ici ou cliquez pour importer', 'Tap to edit': 'Toucher pour modifier',
  // ---- cashier
  'Cashier': 'Caisse', '▶ Open the cashier system (POS)': '▶ Ouvrir la caisse (TPE)', 'Cashier settings': 'Paramètres de caisse',
  '📊 Statistics for the current period': '📊 Statistiques de la période', 'Total time': 'Temps total', 'Total sales': 'Ventes totales',
  'Total orders': 'Commandes', '🔗 Kitchen Display URL': '🔗 URL écran cuisine', '🔗 Client Display URL': '🔗 URL écran client', 'Copy': 'Copier',
  '📅 Daily transaction history': '📅 Historique du jour', 'Today': "Aujourd'hui",
  'No transactions yet today.': "Aucune transaction aujourd'hui.",
  '← Exit POS': '← Quitter la caisse', '🔍 Scan a barcode or search a product': '🔍 Scannez un code-barres ou cherchez un produit',
  'Order': 'Commande', '+ Add a client': '+ Ajouter un client', 'Subtotal': 'Sous-total', 'Discount': 'Remise',
  'All categories': 'Toutes catégories', 'Clothing': 'Vêtements', 'Accessories': 'Accessoires',
  'Cash (POS)': 'Espèces (TPE)', 'Card (POS)': 'Carte (TPE)', 'Online': 'En ligne', 'Cash': 'Espèces',
  'No items yet — tap a product to add it.': 'Aucun article — touchez un produit pour l’ajouter.', 'No matching products.': 'Aucun produit trouvé.',
  '⚙️ Cashier settings': '⚙️ Paramètres de caisse', 'Cashier name': 'Nom du caissier', 'Receipt footer': 'Pied de ticket',
  'Print receipt automatically': 'Imprimer le ticket automatiquement', 'Ask for client on every sale': 'Demander le client à chaque vente',
  'Save settings': 'Enregistrer', '👤 Add a client to this order': '👤 Ajouter un client à la commande', '+ New client': '+ Nouveau client',
  'Walk-in customer': 'Client de passage',
  // ---- clients
  '+ Add Client': '+ Ajouter un client', 'Phone': 'Téléphone', 'Email': 'E-mail', 'Number of Invoices': 'Nombre de factures',
  'Add client': 'Ajouter le client', 'e.g. Aïcha Ndour': 'ex. Aïcha Ndour', 'Email (optional)': 'E-mail (facultatif)', 'name@email.com': 'nom@email.com',
  'Invoice': 'Facture', 'No invoices yet.': 'Aucune facture pour le moment.',
  // ---- integration
  'How Mixx Wallet, cards, PayPal and bank transfer actually settle into your account.': 'Comment Mixx Wallet, cartes, PayPal et virements arrivent sur votre compte.',
  'Connected — Mixx Business Payments': 'Connecté — Mixx Business Payments', 'Last settlement: today, 09:14': "Dernier règlement : aujourd'hui, 09:14",
  'Payout account': 'Compte de versement', 'Method': 'Moyen', 'Fee': 'Frais', 'Settlement': 'Règlement', 'Not activated': 'Non activé',
  'Instant, your Mixx Wallet': 'Instantané, sur votre Mixx Wallet', 'T+1, your bank account': 'J+1, sur votre compte bancaire',
  'T+2, your bank account': 'J+2, sur votre compte bancaire', 'T+2, your PayPal balance': 'J+2, sur votre solde PayPal',
  'Mixx Business never touches settlement funds directly for card/PayPal rails — those route through licensed, PCI-DSS regulated gateways. Mixx Wallet and bank transfer settle natively.':
    'Mixx Business ne détient jamais les fonds carte/PayPal — ils transitent par des passerelles agréées PCI-DSS. Mixx Wallet et les virements sont réglés nativement.',
  // ---- settings
  'Business profile, preferences and payout account.': 'Profil, préférences et compte de versement.', 'Save changes': 'Enregistrer',
  '🏪 Business profile': "🏪 Profil de l'entreprise", 'Owner name': 'Nom du gérant', 'City': 'Ville', '🎨 Preferences': '🎨 Préférences',
  'Language': 'Langue', 'Colour theme': 'Thème de couleur', 'E-mail me when an invoice is paid': "M'avertir par e-mail quand une facture est payée",
  'SMS receipts to customers': 'Reçus SMS aux clients', 'Two-factor login': 'Connexion à deux facteurs', '🏦 Payout account': '🏦 Compte de versement',
  'Edit payout account': 'Modifier le compte de versement', 'Mixx Wallet number': 'Numéro Mixx Wallet', 'Bank name': 'Banque',
  'IBAN / account number': 'IBAN / numéro de compte', 'Account holder': 'Titulaire du compte', 'Save payout account': 'Enregistrer le compte',
  // ---- reports
  '⬇ Export CSV': '⬇ Exporter CSV', 'Revenue trend': "Évolution du chiffre d'affaires", 'Last 6 months · XOF': '6 derniers mois · XOF',
  'Collected by payment method': 'Encaissé par moyen de paiement', 'Card': 'Carte', 'Top clients': 'Meilleurs clients',
  'Apr': 'Avr', 'May': 'Mai', 'Jun': 'Juin', 'Jul': 'Juil', 'Aug': 'Août', 'Sep': 'Sep',
  // ---- express + sent
  'Invoice Amount': 'Montant de la facture', 'Description (optional)': 'Description (facultatif)', 'Repair service': 'Service de réparation',
  'Add client details': 'Ajouter les infos client', 'Requesting fees from your customer': 'Frais à la charge du client', '+ Add discount': '+ Ajouter une remise',
  'Create Invoice': 'Créer la facture', 'The invoice is ready to be sent!': 'La facture est prête à être envoyée !',
  'The payment link is ready to be shared!': 'Le lien de paiement est prêt à être partagé !',
  'Send via Email': 'Envoyer par e-mail', 'Send via SMS': 'Envoyer par SMS', 'Share via WhatsApp': 'Partager sur WhatsApp',
  'Widget to my site': 'Widget pour mon site', '👁 Preview payment page': '👁 Aperçu de la page de paiement', 'Done': 'Terminé',
  // ---- plans
  '⬆ Plans & billing': '⬆ Forfaits et facturation', 'Up to 10 invoices / month': "Jusqu'à 10 factures / mois", 'Online store (6 products)': 'Boutique en ligne (6 produits)',
  'Choose Free': 'Choisir Gratuit', '/month': '/mois', 'Unlimited invoices': 'Factures illimitées', 'Unlimited products': 'Produits illimités',
  'Cashier (POS) & reports': 'Caisse (TPE) et rapports', 'Custom domain': 'Domaine personnalisé', 'Choose Professional': 'Choisir Professionnel',
  'Dedicated account manager': 'Gestionnaire de compte dédié', 'API & integrations': 'API et intégrations', 'Custom invoice design': 'Factures personnalisées',
  'Contact sales': 'Contacter les ventes', 'Sandbox — changing plan here does not charge you.': "Démo — changer de forfait ici n'entraîne aucun paiement.",
  'Compare all plans →': 'Comparer les forfaits →', 'Current plan': 'Forfait actuel',
  // ---- checkout
  '← Back to dashboard': '← Retour au tableau de bord', 'Amount due': 'Montant dû',
  '⚠️ Sandbox checkout — this is a demo environment, no real funds move.': '⚠️ Paiement de démonstration — aucun fonds réel n’est débité.',
  'Card number': 'Numéro de carte', 'Expiry': 'Expiration', 'CVV': 'CVV',
  'Card details are tokenised — Mixx Business never stores the full card number.': 'Les données de carte sont tokenisées — Mixx Business ne stocke jamais le numéro complet.',
  'PayPal e-mail': 'E-mail PayPal', 'The customer confirms this payment by logging into PayPal.': 'Le client confirme ce paiement en se connectant à PayPal.',
  "I've sent the transfer": "J'ai effectué le virement",
  'The customer confirms this payment in their Mixx app or with their PIN.': 'Le client confirme ce paiement dans son app Mixx ou avec son code PIN.',
  'Confirming with your provider…': 'Confirmation auprès de votre opérateur…', 'Payment confirmed': 'Paiement confirmé',
  "Payments are encrypted and processed by Mixx Business's licensed payment partners.": 'Les paiements sont chiffrés et traités par les partenaires agréés de Mixx Business.',
  // ---- notifications
  'Invoice #1043 was paid': 'La facture #1043 a été payée', 'Payout sent to your Mixx Wallet': 'Versement envoyé sur votre Mixx Wallet',
  'New order from your online store': 'Nouvelle commande sur votre boutique', 'Stock low: Sac à main cuir (6 left)': 'Stock faible : Sac à main cuir (6 restants)',
  '2 hours ago': 'Il y a 2 heures', 'This morning': 'Ce matin', 'Yesterday': 'Hier', '2 days ago': 'Il y a 2 jours',
  'You’re all caught up.': 'Vous êtes à jour.',
  // ---- toasts (titles + bodies)
  'Welcome back': 'Bon retour', 'Welcome to Mixx Business Lite': 'Bienvenue sur Mixx Business Lite',
  'Signed in': 'Connecté', 'Invoice updated': 'Facture mise à jour', 'Activation started': 'Activation lancée', 'Method activated': 'Moyen activé',
  'Link copied': 'Lien copié', 'Paste it anywhere to share.': 'Collez-le où vous voulez pour le partager.',
  'This is a sandbox — no real message was sent.': "Démo — aucun message réel n'a été envoyé.",
  'Product updated': 'Produit mis à jour', 'Product added': 'Produit ajouté', 'Client added': 'Client ajouté',
  'Nothing to charge': 'Rien à encaisser', 'Add a product to the order first.': "Ajoutez d'abord un produit à la commande.",
  'Payment received': 'Paiement reçu', 'Settings saved': 'Paramètres enregistrés', 'Your changes have been saved.': 'Vos modifications ont été enregistrées.',
  'Payout account saved': 'Compte de versement enregistré', 'Plan updated': 'Forfait mis à jour', 'Export ready': 'Export prêt',
  'invoices.csv was downloaded.': 'invoices.csv a été téléchargé.', 'Image added': 'Image ajoutée', 'Field added': 'Champ ajouté',
  'Client selected': 'Client sélectionné', 'Filters reset': 'Filtres réinitialisés', 'All notifications marked as read.': 'Toutes les notifications sont lues.',
  'Notifications cleared': 'Notifications lues', 'Reset link sent': 'Lien envoyé', 'Logged out': 'Déconnecté', 'See you soon!': 'À bientôt !',
  'Language': 'Langue', 'English selected.': 'Anglais sélectionné.', 'Français sélectionné.': 'Français sélectionné.',
  'Please pay here:': 'Veuillez payer ici :', 'Express payment': 'Paiement express', 'Payment link': 'Lien de paiement',
  'POS sale': 'Vente en caisse', 'Pop-up market booth fee': 'Stand marché éphémère', 'Wholesale sample pack': "Pack d'échantillons grossiste",
  'Custom order deposit': 'Acompte commande personnalisée', 'Consulting session': 'Séance de conseil', 'Wedding order': 'Commande mariage',
  '🚶': '🚶', 'Choose': 'Choisir',

  // ---- v4: accounts, guest, admin
  'Username or e-mail': "Nom d'utilisateur ou e-mail", 'e.g. aissatou': 'ex. aissatou', 'Enter your username or e-mail.': "Saisissez votre nom d'utilisateur ou e-mail.",
  'Enter your password.': 'Saisissez votre mot de passe.', 'Wrong username or password.': "Nom d'utilisateur ou mot de passe incorrect.",
  'This account has been disabled. Contact support.': 'Ce compte a été désactivé. Contactez le support.',
  '👀 Continue as guest': '👀 Continuer en invité', 'Try every feature for free. Nothing is saved after you close the tab.': "Essayez toutes les fonctionnalités gratuitement. Rien n'est conservé après la fermeture de l'onglet.",
  'Demo accounts': 'Comptes de démonstration', 'Merchant': 'Marchand', 'Admin': 'Admin', 'Tap a row to fill the form.': 'Touchez une ligne pour remplir le formulaire.',
  'Username': "Nom d'utilisateur", 'e.g. boutique.aissatou': 'ex. boutique.aissatou', 'Use 3–20 letters, numbers, dots or dashes.': '3 à 20 lettres, chiffres, points ou tirets.',
  'Confirm password': 'Confirmer le mot de passe', 'Type it again': 'Saisissez-le à nouveau', 'Passwords do not match.': 'Les mots de passe ne correspondent pas.',
  'This username is already taken.': "Ce nom d'utilisateur est déjà pris.", 'An account already uses this e-mail.': 'Un compte utilise déjà cet e-mail.',
  "You're in guest mode.": 'Vous êtes en mode invité.', 'Everything works, but nothing is saved after you close this tab.': "Tout fonctionne, mais rien n'est conservé après la fermeture de l'onglet.",
  'Create free account': 'Créer un compte gratuit', 'Guest mode': 'Mode invité', 'Guest': 'Invité',
  'Try everything — nothing is saved after you close this tab.': "Essayez tout — rien n'est conservé après la fermeture de l'onglet.",
  'Create an account first': "Créez d'abord un compte", 'Plans apply to registered accounts.': "Les forfaits s'appliquent aux comptes inscrits.",
  'Free plan limit reached': 'Limite du forfait Gratuit atteinte', 'Upgrade to Professional for unlimited invoices.': 'Passez au forfait Professionnel pour des factures illimitées.',
  'Add a client to this invoice first.': "Ajoutez d'abord un client à cette facture.",
  'No invoices yet — create your first one with + New.': 'Aucune facture — créez la première avec + Nouveau.',
  'Signed in as administrator.': 'Connecté en tant qu’administrateur.',
  '🔑 Change password': '🔑 Changer le mot de passe', 'Current password': 'Mot de passe actuel', 'New password': 'Nouveau mot de passe',
  'Confirm new password': 'Confirmer le nouveau mot de passe', 'Update password': 'Mettre à jour', 'Current password is incorrect.': 'Mot de passe actuel incorrect.',
  'Something went wrong.': "Une erreur s'est produite.", 'Password changed': 'Mot de passe modifié', 'Use your new password next time you log in.': 'Utilisez votre nouveau mot de passe à la prochaine connexion.',
  '⬇ Download my data': '⬇ Télécharger mes données', 'Your data file was downloaded.': 'Votre fichier de données a été téléchargé.',
  'Storage full': 'Stockage plein', 'Remove some product images or export your data.': 'Supprimez des images de produits ou exportez vos données.',
  'This file is not an image.': "Ce fichier n'est pas une image.",
  'Welcome to Mixx Business Lite': 'Bienvenue sur Mixx Business Lite',
  // admin
  'ADMIN': 'ADMIN', 'Overview': "Vue d'ensemble", 'Accounts': 'Comptes', 'Data & settings': 'Données et paramètres',
  'Platform overview': "Vue d'ensemble de la plateforme", 'All merchants on Mixx Business Lite.': 'Tous les marchands de Mixx Business Lite.',
  '⬇ Export to Excel': '⬇ Exporter vers Excel', 'Merchants': 'Marchands', 'Active accounts': 'Comptes actifs', 'Total collected': 'Total encaissé',
  'Accounts by plan': 'Comptes par forfait', 'Accounts by country': 'Comptes par pays', 'Top merchants': 'Meilleurs marchands', 'All accounts': 'Tous les comptes',
  'Business': 'Entreprise', 'Plan': 'Forfait', 'Collected': 'Encaissé', 'No accounts yet.': 'Aucun compte pour le moment.',
  'Registered merchants. Disabled accounts cannot log in.': 'Marchands inscrits. Les comptes désactivés ne peuvent pas se connecter.',
  '🔍 Search by name, username or e-mail...': "🔍 Rechercher par nom, nom d'utilisateur ou e-mail...",
  'All statuses': 'Tous les statuts', 'Disabled': 'Désactivé', 'Joined': 'Inscrit le', 'Last login': 'Dernière connexion', 'Actions': 'Actions',
  'Disable': 'Désactiver', 'Enable': 'Activer', 'Reset password': 'Réinitialiser le mot de passe', 'Delete': 'Supprimer', 'No accounts match.': 'Aucun compte trouvé.',
  '‹ Accounts': '‹ Comptes', "👁 Read-only view of this merchant's data.": 'Consultation seule des données de ce marchand.', 'Profile': 'Profil',
  'Latest transactions': 'Dernières transactions', 'No clients yet.': 'Aucun client pour le moment.', 'No products yet.': 'Aucun produit pour le moment.',
  'No transactions yet.': 'Aucune transaction pour le moment.', 'Payout account': 'Compte de versement',
  'Backups, exports and the admin password.': "Sauvegardes, exports et mot de passe administrateur.",
  '💾 Where the data is stored': '💾 Où sont stockées les données',
  'In this version, all accounts and merchant data are saved in this browser on this computer. Download a backup to keep a copy or move it to another computer.':
    'Dans cette version, tous les comptes et données sont enregistrés dans ce navigateur, sur cet ordinateur. Téléchargez une sauvegarde pour en garder une copie ou la transférer.',
  '⬇ Export': '⬇ Exporter', 'Export everything to Excel': 'Tout exporter vers Excel', 'Download backup (.json)': 'Télécharger la sauvegarde (.json)',
  '⬆ Restore': '⬆ Restaurer', 'Load a backup file. This replaces all accounts and data in this browser.': 'Chargez une sauvegarde. Elle remplace tous les comptes et données de ce navigateur.',
  'Choose backup file…': 'Choisir un fichier…', '🔑 Admin password': '🔑 Mot de passe administrateur',
  '⚠️ Reset demo data': '⚠️ Réinitialiser la démo', 'Deletes every account and all data in this browser and restores the original demo accounts.': 'Supprime tous les comptes et données de ce navigateur et restaure les comptes de démonstration.',
  'Reset everything': 'Tout réinitialiser', '🔑 Reset password': '🔑 Réinitialiser le mot de passe', 'Generate a password': 'Générer un mot de passe',
  'Set new password': 'Définir le mot de passe', 'Are you sure?': 'Êtes-vous sûr ?', 'Cancel': 'Annuler', 'Confirm': 'Confirmer',
  'Delete account?': 'Supprimer le compte ?', 'Reset everything?': 'Tout réinitialiser ?', 'Reset demo merchants?': 'Réinitialiser les marchands de démo ?', 'Reset demo merchants': 'Réinitialiser les marchands de démo', 'The demo merchants will be restored to their original data. Other merchants and the admin account are not touched.': 'Les marchands de démonstration retrouveront leurs données d\x27origine. Les autres marchands et le compte admin ne sont pas modifiés.', 'Merchants in the backup that still exist will get their profile and data back. This overwrites their current data.': 'Les marchands de la sauvegarde qui existent encore retrouveront leur profil et leurs données. Leurs données actuelles seront remplacées.', 'The demo merchants are back to their original data.': 'Les marchands de démonstration ont retrouvé leurs données d\x27origine.', 'Reset failed': 'Échec de la réinitialisation', 'Could not create your account': 'Impossible de créer votre compte', 'Please check your connection and try again.': 'Vérifiez votre connexion et réessayez.', 'Restore this backup?': 'Restaurer cette sauvegarde ?', 'Restore': 'Restaurer',
  'All accounts and data in this browser will be replaced by the original demo accounts. Download a backup first if you need it.': 'Tous les comptes et données de ce navigateur seront remplacés par les comptes de démonstration. Téléchargez une sauvegarde avant si besoin.',
  'All accounts and data in this browser will be replaced by the backup file.': 'Tous les comptes et données de ce navigateur seront remplacés par la sauvegarde.',
  'Account enabled': 'Compte activé', 'Account disabled': 'Compte désactivé', 'Account deleted': 'Compte supprimé', 'Password reset': 'Mot de passe réinitialisé',
  'New password copied — share it with the merchant.': 'Nouveau mot de passe copié — communiquez-le au marchand.',
  'Backup downloaded': 'Sauvegarde téléchargée', 'Keep this file safe — it contains every account.': 'Conservez ce fichier en lieu sûr — il contient tous les comptes.',
  'Restore failed': 'Échec de la restauration', 'This is not a valid backup file.': "Ce n'est pas un fichier de sauvegarde valide.",
  'Backup restored': 'Sauvegarde restaurée', 'Log in again with an account from the backup.': 'Reconnectez-vous avec un compte de la sauvegarde.',
  'Demo data restored': 'Démo restaurée', 'Log in again with the demo accounts.': 'Reconnectez-vous avec les comptes de démonstration.',
  'Export failed': "Échec de l'export", 'Excel library not loaded.': 'Bibliothèque Excel non chargée.', 'Excel file with all merchants was downloaded.': 'Le fichier Excel de tous les marchands a été téléchargé.',

  // ---- v5: dashboard, payment methods & MDR, QR, reports, admin
  'Turn on or off': 'Activer ou désactiver', 'MDR per transaction': 'MDR par transaction', 'special rate': 'taux spécial', 'This month': 'Ce mois-ci',
  'Fees this month': 'Frais ce mois-ci', 'Customer pays': 'Le client paie', 'You receive': 'Vous recevez', 'Payment QR code': 'QR code de paiement',
  'Interoperable QR — scan with Mixx by Yas or any interoperable wallet or bank app': 'QR interopérable — scannez avec Mixx by Yas ou toute application de portefeuille ou bancaire interopérable',
  'Scan & pay': 'Scannez et payez', 'Any wallet or bank app': 'Toute app de paiement ou bancaire',
  'open Mixx by Yas or any interoperable wallet or bank app, scan the code above and confirm.': 'ouvrez Mixx by Yas ou toute application de portefeuille ou bancaire interopérable, scannez le code ci-dessus et confirmez.',
  'Pay by QR': 'Payer par QR', 'Simulate a scan (demo)': 'Simuler un scan (démo)', 'or pay here': 'ou payez ici',
  'No payment method is active for this merchant.': "Aucun moyen de paiement n'est actif pour ce marchand.", 'MDR': 'MDR', 'Merchant receives': 'Le marchand reçoit',
  'fee': 'frais', 'net': 'net', 'All clients': 'Tous les clients', 'Since you joined': 'Depuis votre inscription', 'No transactions in this period.': 'Aucune transaction sur cette période.',
  'By hour · XOF': 'Par heure · XOF', 'By month · XOF': 'Par mois · XOF', 'By day · XOF': 'Par jour · XOF', 'transactions': 'transactions', 'tx': 'trans.',
  'No MDR': 'Sans MDR', 'No client payments in this period.': 'Aucun paiement client sur cette période.', 'was downloaded.': 'a été téléchargé.',
  'Sales report': 'Rapport des ventes', 'Payment methods & MDR': 'Moyens de paiement et MDR', 'Transactions': 'Transactions',
  'Showing the latest 300 transactions. Export CSV for the full list.': 'Affichage des 300 dernières transactions. Exportez le CSV pour la liste complète.',
  'Generated': 'Généré le', 'Off for all merchants': 'Désactivé pour tous', 'On': 'Activé', 'Off': 'Désactivé', 'Allowed': 'Autorisé', 'Blocked': 'Bloqué',
  'Disabled by admin': "Désactivé par l'admin", 'Unavailable': 'Indisponible', 'Not available': 'Non disponible', 'Method deactivated': 'Moyen désactivé',
  'Deactivate': 'Désactiver', 'PDF library not loaded.': 'Bibliothèque PDF non chargée.', 'MDR must be between 0 and 10%.': 'Le MDR doit être compris entre 0 et 10 %.',
  'Payment methods and MDR updated for all merchants.': 'Moyens de paiement et MDR mis à jour pour tous les marchands.',
  'This week': 'Cette semaine', 'All time': 'Depuis le début', 'Last 3 months': '3 derniers mois', 'Last 6 months': '6 derniers mois',
  'vs yesterday (same time)': 'vs hier (même heure)', 'vs last week (same point)': 'vs semaine dernière (même moment)', 'vs last month (same point)': 'vs mois dernier (même moment)',
  'Mixx Business Lite — Merchant Dashboard': 'Mixx Business Lite — Espace marchand',
  '📊 Full reports': '📊 Rapports complets', 'Fees (MDR)': 'Frais (MDR)', 'Net received': 'Net reçu', 'Average ticket': 'Panier moyen',
  'Revenue over time': "Évolution du chiffre d'affaires", 'By payment method': 'Par moyen de paiement', 'Manage payment methods →': 'Gérer les moyens de paiement →',
  'Share by payment method': 'Répartition par moyen de paiement', 'Store orders': 'Commandes boutique', 'Cashier sales': 'Ventes en caisse',
  '💳 Latest transactions': '💳 Dernières transactions', 'Back to invoices': 'Retour aux factures', 'Manage payment methods & MDR': 'Gérer les moyens de paiement et le MDR',
  'Back to payment links': 'Retour aux liens de paiement', 'Back': 'Retour', 'Back to dashboard': 'Retour au tableau de bord', 'Back to accounts': 'Retour aux comptes',
  'Payment methods': 'Moyens de paiement',
  'Turn each payment method on or off, see its MDR (fee per transaction) and how it settles into your account.': 'Activez ou désactivez chaque moyen de paiement, consultez son MDR (frais par transaction) et son mode de règlement.',
  '🧮 MDR calculator': '🧮 Calculateur de MDR', 'What you receive after fees': 'Ce que vous recevez après frais', 'Amount (XOF)': 'Montant (XOF)', 'Payment method': 'Moyen de paiement',
  'How it works': 'Comment ça marche',
  '(merchant discount rate) is the percentage taken from each payment by the payment method.': '(commission marchand) est le pourcentage prélevé sur chaque paiement par le moyen de paiement.',
  'Rates are set by Mixx Business Lite. Your account may have a special rate agreed with your account manager.': 'Les taux sont fixés par Mixx Business Lite. Votre compte peut bénéficier d’un taux spécial convenu avec votre chargé de compte.',
  'Switching a method off hides it from your checkout pages, invoices and cashier straight away.': 'Désactiver un moyen le retire immédiatement de vos pages de paiement, factures et caisse.',
  'A method marked': 'Un moyen marqué', 'can only be switched back on by the Mixx team.': "ne peut être réactivé que par l'équipe Mixx.",
  'Card and PayPal payments route through licensed, PCI-DSS regulated gateways. Mixx Wallet and bank transfer settle natively.': 'Les paiements carte et PayPal passent par des passerelles agréées PCI-DSS. Mixx Wallet et les virements sont réglés nativement.',
  '⬇ Export PDF': '⬇ Exporter PDF', 'Fees': 'Frais', 'Net': 'Net',
  'Default rates and availability for every merchant. You can also set a special rate or block a method for one merchant from their page.': 'Taux par défaut et disponibilité pour tous les marchands. Vous pouvez aussi fixer un taux spécial ou bloquer un moyen pour un marchand depuis sa page.',
  'Default MDR (%)': 'MDR par défaut (%)', 'Available on platform': 'Disponible sur la plateforme', 'Merchants using it': 'Marchands utilisateurs', 'Special rates': 'Taux spéciaux',
  "Turning a method off here removes it from every merchant's checkout, invoices and cashier.": 'Désactiver un moyen ici le retire des pages de paiement, factures et caisses de tous les marchands.',
  'Payment methods for this merchant': 'Moyens de paiement de ce marchand', 'Save': 'Enregistrer', 'Merchant setting': 'Réglage du marchand',
  'MDR for this merchant (%)': 'MDR pour ce marchand (%)', 'Admin control': 'Contrôle admin',
  'Leave the MDR empty to use the default rate. "Blocked" stops the merchant from switching the method on.': 'Laissez le MDR vide pour appliquer le taux par défaut. « Bloqué » empêche le marchand d’activer ce moyen.',
  'Dashboard filters': 'Filtres du tableau de bord',
  'Waiting for the customer to confirm in their app…': "En attente de la confirmation du client dans son application…",
  'Card (POS)': 'Carte (TPE)',
  'Please fix the highlighted fields.': 'Veuillez corriger les champs en rouge.', 'Check the form': 'Vérifiez le formulaire',
};

/* Patterns for strings that contain names, numbers or amounts */
const FR_PATTERNS = [
  [/^Pay now — (.+)$/, 'Payer maintenant — $1'],
  [/^Pay (.+)$/, 'Payer $1'],
  [/^Contact your Mixx account manager to use (.+)\.$/, 'Contactez votre chargé de compte Mixx pour utiliser $1.'],
  [/^(.+) is switched off for all merchants\.$/, '$1 est désactivé pour tous les marchands.'],
  [/^(.+) is now off\.$/, '$1 est maintenant désactivé.'],
  [/^(.+) was downloaded\.$/, '$1 a été téléchargé.'],
  [/^POS sale — (.+)$/, 'Vente en caisse — $1'],
  [/^👤 (.+)$/, '👤 $1'],
  [/^Qty (\d+)$/, 'Qté $1'],
  [/^(\d+) invoices?$/, '$1 facture(s)'],
  [/^New invoice for (.+)$/, 'Nouvelle facture pour $1'],
  [/^Receipt (\S+) · a copy was sent by SMS\.$/, 'Reçu $1 · une copie a été envoyée par SMS.'],
  [/^Transfer to: (.+) — IBAN (.+) — reference (.+)\.$/, 'Virement à : $1 — IBAN $2 — référence $3.'],
  [/^Logged in to (.+)\.$/, 'Connecté à $1.'],
  [/^Signed in with (.+)\.$/, 'Connecté avec $1.'],
  [/^Your account for (.+) is ready\.$/, 'Votre compte pour $1 est prêt.'],
  [/^Not connected in this prototype — use a username and password, or continue as guest\.$/, "Non connecté dans ce prototype — utilisez un nom d'utilisateur et un mot de passe, ou continuez en invité."],
  [/^(.+) saved\.$/, '$1 enregistré.'],
  [/^(.+) is now live\.$/, '$1 est en ligne.'],
  [/^(.+) was added to your client list\.$/, '$1 a été ajouté à vos clients.'],
  [/^(.+) will be ready once verification completes \(sandbox\)\.$/, '$1 sera prêt après vérification (démo).'],
  [/^(.+) is now active\.$/, '$1 est maintenant actif.'],
  [/^(.+) via (.+)\.$/, '$1 via $2.'],
  [/^(.+) · (.+) collected\.$/, '$1 · $2 encaissé.'],
  [/^Shared via (.+)$/, 'Partagé via $1'],
  [/^You are now on the (.+) plan\.$/, 'Vous êtes maintenant sur le forfait $1.'],
  [/^(.+) added to this order\.$/, '$1 ajouté à la commande.'],
  [/^Check (.+) for the reset link\.$/, 'Consultez $1 pour le lien.'],
  [/^Wallet (.+) · (.+)$/, 'Wallet $1 · $2'],
  [/^New password for (.+) \((.+)\)\.$/, 'Nouveau mot de passe pour $1 ($2).'],
  [/^This permanently deletes (.+) and all of its data\.$/, 'Cela supprime définitivement $1 et toutes ses données.'],
  [/^Plan changed to (.+)\.$/, 'Forfait changé en $1.'],
  [/^(\d+) KB used of about 5 MB \((\d+)%\)$/, '$1 Ko utilisés sur environ 5 Mo ($2 %)'],
  [/^(.+) sign-in$/, 'Connexion $1'],
  [/^Discount (\d+)%$/, 'Remise $1 %'],
  [/^−(\d+)% discount$/, '−$1 % de remise'],
  [/^(\d+) of 10 invoices used this month$/, '$1 factures sur 10 utilisées ce mois-ci'],
];

let APP_LANG = 'en';
try { APP_LANG = localStorage.getItem('mbl_lang') === 'fr' ? 'fr' : 'en'; } catch (e) {}

function T(s) {
  if (APP_LANG !== 'fr' || s == null) return s;
  const str = String(s);
  if (Object.prototype.hasOwnProperty.call(FR, str)) return FR[str];
  for (const [re, rep] of FR_PATTERNS) { if (re.test(str)) return str.replace(re, (...m) => rep.replace(/\$(\d)/g, (_, i) => (FR[m[i]] || m[i]))); }
  return str;
}

/* ---- DOM translation (keeps the English original on each node) ---- */
const I18N_ATTRS = ['placeholder', 'title', 'aria-label'];
function translateTextNode(n) {
  if (n.__en === undefined) n.__en = n.nodeValue;
  const src = n.__en; const trimmed = src.trim();
  if (!trimmed) return;
  const out = APP_LANG === 'fr' ? src.replace(trimmed, T(trimmed)) : src;
  if (n.nodeValue !== out) n.nodeValue = out;
}
function translateEl(el) {
  if (el.nodeType !== 1) return;
  if (el.closest && el.closest('[data-no-i18n]')) return;
  const tag = el.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE') return;
  if (!el.__enAttr) el.__enAttr = {};
  for (const a of I18N_ATTRS) {
    if (el.hasAttribute(a)) {
      if (el.__enAttr[a] === undefined) el.__enAttr[a] = el.getAttribute(a);
      const v = APP_LANG === 'fr' ? T(el.__enAttr[a]) : el.__enAttr[a];
      if (el.getAttribute(a) !== v) el.setAttribute(a, v);
    }
  }
}
function translateTree(root) {
  if (!root) return;
  if (root.nodeType === 3) { if (!(root.parentElement && root.parentElement.closest('[data-no-i18n],script,style'))) translateTextNode(root); return; }
  if (root.nodeType !== 1) return;
  if (root.closest('[data-no-i18n]')) return;
  translateEl(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (n.nodeType === 1) return (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.hasAttribute('data-no-i18n')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let n; while ((n = w.nextNode())) { if (n.nodeType === 3) translateTextNode(n); else translateEl(n); }
}
const i18nObserver = new MutationObserver(muts => {
  for (const m of muts) {
    if (m.type === 'childList') m.addedNodes.forEach(n => translateTree(n));
    else if (m.type === 'attributes' && I18N_ATTRS.includes(m.attributeName)) {
      const el = m.target; const cur = el.getAttribute(m.attributeName);
      if (cur !== null && el.__enAttr && cur !== el.__enAttr[m.attributeName] && cur !== T(el.__enAttr[m.attributeName])) { el.__enAttr[m.attributeName] = cur; translateEl(el); }
    }
  }
});
function startI18n() {
  translateTree(document.body);
  i18nObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: I18N_ATTRS });
  document.documentElement.lang = APP_LANG;
  document.querySelectorAll('[data-lang-btn]').forEach(b => b.classList.toggle('active', b.getAttribute('data-lang-btn') === APP_LANG));
}
function setAppLang(lang) {
  APP_LANG = lang === 'fr' ? 'fr' : 'en';
  try { localStorage.setItem('mbl_lang', APP_LANG); } catch (e) {}
  document.documentElement.lang = APP_LANG;
  document.querySelectorAll('[data-lang-btn]').forEach(b => b.classList.toggle('active', b.getAttribute('data-lang-btn') === APP_LANG));
  if (typeof appLangChanged === 'function') appLangChanged();   // re-render numbers / dates in the new locale
  translateTree(document.body);
}
