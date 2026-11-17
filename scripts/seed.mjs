/* npm run seed
   One-off setup after supabase/setup.sql: creates the admin account (if it
   doesn't exist yet) and the demo merchants with their sample history.
   Reads SUPABASE_* and optional ADMIN_EMAIL / ADMIN_PASSWORD from .env. */
import crypto from 'node:crypto';
import { ensureAdmin, seedDemoMerchants } from '../netlify/lib/core.mjs';

const email = process.env.ADMIN_EMAIL || 'admin@mixx.africa';
const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');

const a = await ensureAdmin(email, password);
console.log(a.created ? `Admin created: username "admin" (${email}), password: ${password}` : 'Admin already exists — password unchanged.');
const merchants = await seedDemoMerchants();
console.log('Demo merchants ready (password demo123):', merchants.join(', '));
