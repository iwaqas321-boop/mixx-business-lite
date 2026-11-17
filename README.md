# Mixx Business Lite

Invoicing, payment links, online store and cashier (POS) for small merchants, with an admin panel.
Live POC: https://mixx-business-lite.netlify.app (merchant app at `/app/`).

Payments, SMS and social sign-in are sandbox/simulated.

## How it fits together

| Part | Where | What it does |
|---|---|---|
| Front end | `site/` | Static marketing pages and the app at `site/app/`. Only `site/app/store.js` knows where data lives. |
| Database & login | Supabase | `accounts`, `merchant_data` (one JSON workspace per merchant) and `platform` tables, plus Supabase Auth. Row-level security is defined in `supabase/setup.sql`. |
| Server functions | `netlify/functions/` | `/api/login`, `/api/register`, `/api/account` (passwords, e-mail, admin actions) and `/api/checkout` (public payment pages). These are the only code that uses the Supabase secret key. |

## Setup

1. Create a Supabase project and run `supabase/setup.sql` in the SQL Editor.
2. Create a `.env` file (never commit it) containing:
   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   ADMIN_EMAIL=admin@example.com      # optional
   ADMIN_PASSWORD=...                 # optional; generated if left out
   ```
3. Put the project URL and publishable key in `site/app/config.js`.
4. Run `npm install`, then `npm run seed`. This creates the admin account and the demo merchants (aissatou, chezmoussa, awacouture; password `demo123`).
5. In Supabase → Authentication → URL Configuration, set the Site URL to `<your-site>/app/` and allow `<your-site>/**`. Password-reset e-mails need this.

## Run locally

```
netlify dev        # http://localhost:8888/app/
```

## Deploy (Netlify)

Set the three `SUPABASE_*` variables in Netlify's environment settings, then run:

```
netlify deploy --prod --dir site --functions netlify/functions
```

---

> **Prototype notes (v5).** The notes below describe the browser-only prototype. Its admin login (`Mixx@2026`) and "where the data is saved" no longer apply. Data now lives in Supabase and the admin password is set when you run `npm run seed`.

# Mixx Business Lite: v5 (dashboard, MDR, interop QR)

**Version 5 · 30 September 2026 · Axian Group**

v5 (accounts, guest mode, admin, real Mixx logo) and adds the changes from the 30 September review.

## What's new in v5
| # | Change | Where |
|---|---|---|
| 1 | **Interop QR on every payment page.** An EMVCo merchant-presented QR (merchant, amount, XOF, reference, CRC) sits in the blue header with "Scan & pay · any wallet or bank app". A "Simulate a scan (demo)" button completes the payment | Payment / checkout page |
| 2 | **Back buttons** on every inner screen | Invoice editor, payment-link editor, product editor, settings, admin merchant page, checkout; every inner website page |
| 3 | **MDR per payment method.** The admin sets default MDR, and can set a special rate per merchant. Merchants see their rates, a calculator, and the fee and net on every transaction and receipt | Merchant → Payment methods; Admin → Payment methods & MDR |
| 4 | **Activate / deactivate payment methods.** Merchants switch their own methods on and off. The admin can turn a method off for everyone, or block it for one merchant, and a blocked method can't be re-enabled by the merchant. Checkout, invoices and cashier only offer active methods | Merchant → Payment methods; Admin |
| 5 | **Reports export to PDF** (branded, with KPIs, trend chart, MDR table and transactions), plus CSV with fee and net columns and a period selector | Reports |
| 6 | **Menu dropdowns fixed.** They no longer close while moving the mouse into them, and tap or keyboard also works | Website menu |
| 7 | **"Trusted by" name tags replaced** by an honest "Accept payments from every channel" strip: Mixx by Yas logo plus generic icons (wallets, cards, interop QR, bank, links, PayPal) | Homepage |
| 8 | **4.8 rating box fixed** (stars in a row, review count) | Homepage |
| 9 | **Unreadable hero text fixed** on Contact, FAQ, Pricing and About (blue theme) | Website |
| 10 | **New dashboard.** Period filters (Today / This week / This month / All time) and a client filter; total, fees, net, transactions and average ticket with change vs the previous period; revenue chart with hover; a box per payment method plus cash; share donut; top clients; KPI boxes. **Every box is clickable** | Merchant dashboard |
| + | Found in testing: 6 feature pages had a broken hero layout (from v1), now fixed. Demo merchants have ~6 months of realistic transaction history so the charts and filters have data | Website, sample data |

## How to open it
Unzip the folder and double-click **`index.html`**. It needs no internet, no server and no install.

## Who can log in
| Role | Username | Password | What they can do |
|---|---|---|---|
| **Admin** | `admin` | `Mixx@2026` | See every account and all merchants' data, manage accounts, export, back up and restore |
| **Demo merchant** | `aissatou` | `demo123` | Full dashboard with sample data |
| Other demo merchants | `chezmoussa` / `awacouture` | `demo123` | `awacouture` is **disabled** on purpose, to show the admin controls |
| **New merchant** | Register | Their own | Starts with an empty workspace, and their data is saved |
| **Guest** | "Continue as guest" | none | Everything works with sample data; it's wiped when the tab closes |

- Only registered accounts can log in, and disabled accounts are refused.
- Tap **Demo accounts** on the login screen to fill in the details.
- **Change the admin password** in Admin → Data & settings before a real demo.

## Accounts
- **Register:** username, e-mail, phone, country, password with confirmation, and a plan choice. Duplicate usernames and e-mails are refused.
- **Log in:** with a username or e-mail. "Remember me" keeps you signed in; if it's unticked, the session lasts for this tab only.
- **Settings:** edit the business profile, change your password, edit the payout account and download your own data (.json).
- **Free plan:** limited to 10 invoices a month. The 11th asks the merchant to upgrade.

## Admin panel (`admin` login)
- **Overview:** number of merchants, active accounts, total collected, invoices, accounts by plan and by country, and top merchants.
- **Accounts:** search, filter by status, change plan, disable or enable, reset password (it generates one and copies it), and delete.
- **Merchant view:** a read-only look at any merchant's invoices, clients, products, payment links, transactions and profile.
- **Data & settings:**
  - Export everything to **Excel**, with 6 sheets.
  - Download or restore a **backup** (.json).
  - Change the admin password.
  - Reset all demo data.

## Where the data is saved (stage 1: this version)
| Data | Where |
|---|---|
| Accounts and every merchant's data | This browser's local storage, key `mbl_db_v4` |
| Login session | Local storage with "Remember me", session storage without |
| Guest data | Session storage, removed when the tab closes |
| Language and theme | Local storage, shared with the website |

- Passwords are **salted and hashed (SHA-256)** and never stored in plain text. This is still a front-end prototype, so the security is simulated.
- Data belongs to **one browser on one computer**. To move it, use the admin **Backup** and **Restore** buttons.
- The browser allows about 5 MB. Product images are shrunk automatically, and the Data & settings page shows how much is used.
- **Don't enter real customer or bank data** in this version.

## Stage 2: moving to a real backend (Supabase)
- `app/store.js` is the **only** file that reads or writes accounts and data. Every function already returns a Promise, the same shape Supabase uses.
- `supabase/schema.sql` creates the tables and the security rules:
  - Merchants see only their own data.
  - Admins see everything.
  - Disabled accounts are blocked.
  - Supabase Auth handles passwords and reset e-mails.
- The switch means creating the Supabase project, running the schema, and replacing the function bodies in `store.js`. `app.js` and `admin.js` don't change.
- Before any real client data goes in, this needs Axian IT and security approval, and a check of data-protection rules in Senegal, Togo and Tanzania.

## Folder structure
```
mixx-business-lite-v4/
├── index.html … legal.html      website (EN/FR, Blue/White) — unchanged from v3
├── features/                     8 feature pages
├── app/
│   ├── index.html                login · register · guest · merchant dashboard · admin panel
│   ├── store.js                  ← storage layer (swap for Supabase in stage 2)
│   ├── app.js                    merchant dashboard
│   ├── admin.js                  admin panel
│   ├── app-v5.js                 v5: dashboard, payment methods & MDR, QR, PDF, admin gateways
│   ├── app-i18n.js               EN/FR
│   ├── app.css
│   └── vendor/                   xlsx (SheetJS, Apache-2.0) · jsPDF (MIT) · qrcode-generator (MIT)
├── supabase/schema.sql           stage 2 database + security rules
├── css/  js/  fonts/             website styles, scripts, Figtree
└── README.md
```

## Things to know about the QR
- The QR follows the EMVCo merchant-presented format used by interoperable schemes, and it decodes correctly with a checksum.
- The merchant ID and network identifier in it are **placeholders** (`COM.MIXXBYYAS.INTEROP`, `MXB…`). Real consumer apps will only accept it once Mixx provides the real interop scheme values.
- MDR changes apply to new payments. Past transactions keep the fee they were charged.

## Tested
A headless-browser test ran in EN and FR:
- **104 account, guest and admin checks** passed.
- **501 dashboard and flow checks** passed, including filters, clickable boxes, gateway on/off, the MDR calculator and CSV and PDF export.
- **2,920 links** checked, all working.
- The QR decoded back to the exact payload with a valid CRC.
- No JS errors, and no horizontal scroll at phone width.
