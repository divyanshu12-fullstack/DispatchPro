import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { connectDB, disconnectDB } from './config/db.js';
import User from './models/User.js';
import Zone from './models/Zone.js';
import Area from './models/Area.js';
import RateCard from './models/RateCard.js';

// Full seed: ADMIN user + Zones + Areas (pincode → zone) + RateCards.
// Idempotent — every section upserts by its natural unique key, so re-running
// with the same inputs is a no-op. Admin password is NOT overwritten on
// re-run (that would silently invalidate other admins' sessions).
//
// Run with:  npm run seed

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PINCODES_FILE = path.join(__dirname, 'data', 'pincodes.json');

function seedAdminConfig() {
  const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = (process.env.SEED_ADMIN_NAME || '').trim();

  if (!email || !password || !fullName) {
    console.error(
      '[seed] Missing required env vars. Set SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME in backend/.env.'
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('[seed] SEED_ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }
  return { email, password, fullName };
}

async function seedAdmin({ email, password, fullName }) {
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'ADMIN') {
      console.error(
        `[seed] Refusing to overwrite: ${email} exists with role=${existing.role}. Delete the user first or use a different email.`
      );
      process.exit(1);
    }
    console.log(`[seed] Admin already exists: ${email} — skipped`);
    return;
  }

  const bcrypt = (await import('bcrypt')).default;
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    email,
    passwordHash,
    fullName,
    role: 'ADMIN',
    isEmailVerified: true,
  });
  console.log(`[seed] Created ADMIN: ${email}`);
}

// Zone schema requires a short unique code (max 16). Derived deterministically
// from the name so re-runs always map to the same code.
function deriveZoneCode(name) {
  const words = name.split(/\s+/).filter(Boolean);
  const initials = words.map((w) => w[0]).join('');
  const compact = name.replace(/[^A-Za-z]/g, '').slice(0, 8);
  const code = `${compact.slice(0, 12)}-${initials}`.slice(0, 16).toUpperCase();
  return code;
}

async function seedPincodes() {
  const raw = JSON.parse(readFileSync(PINCODES_FILE, 'utf-8'));
  const entries = Object.entries(raw);
  if (!entries.length) {
    console.error('[seed] data/pincodes.json contains no pincodes.');
    process.exit(1);
  }

  // 1. Upsert zones from the distinct zone names.
  const zoneNames = [...new Set(entries.map(([, v]) => v.zone))];
  const zoneIdByName = new Map();
  for (const name of zoneNames) {
    const code = deriveZoneCode(name);
    const zone = await Zone.findOneAndUpdate(
      { $or: [{ code }, { name }] },
      { $setOnInsert: { name, code, isActive: true } },
      { upsert: true, new: true },
    );
    zoneIdByName.set(name, zone._id);
  }
  console.log(`[seed] Zones ready: ${zoneNames.length} (${zoneNames.join(', ')})`);

  // 2. Bulk upsert areas: pincode → zoneId. Ordered:false lets duplicates
  //    within one batch fall through without aborting the whole insert.
  const areaOps = entries.map(([pincode, { district, state, zone }]) => ({
    updateOne: {
      filter: { pincode },
      update: {
        $set: {
          zoneId: zoneIdByName.get(zone),
          city: district,
          state,
          isServiceable: true,
        },
      },
      upsert: true,
    },
  }));

  let written = 0;
  for (let i = 0; i < areaOps.length; i += 500) {
    const batch = areaOps.slice(i, i + 500);
    const res = await Area.bulkWrite(batch, { ordered: false });
    written += res.upsertedCount + res.modifiedCount;
  }
  console.log(`[seed] Areas written: ${written}/${entries.length} pincodes`);
}

// Pricing lives only in the database (zero hardcoded rates in app logic).
// These are realistic INR starting points for NCR operations — tune via DB or
// a future rate-card admin endpoint; the seed only fills what's missing.
const RATE_CARDS = [
  { orderType: 'B2C', tripType: 'INTRA_ZONE', baseWeight: 0.5, baseRate: 40, additionalPerKgRate: 15, codSurchargeFixed: 30, codSurchargePercent: 1.5 },
  { orderType: 'B2C', tripType: 'INTER_ZONE', baseWeight: 0.5, baseRate: 65, additionalPerKgRate: 25, codSurchargeFixed: 35, codSurchargePercent: 2 },
  { orderType: 'B2B', tripType: 'INTRA_ZONE', baseWeight: 1, baseRate: 35, additionalPerKgRate: 10, codSurchargeFixed: 25, codSurchargePercent: 1 },
  { orderType: 'B2B', tripType: 'INTER_ZONE', baseWeight: 1, baseRate: 55, additionalPerKgRate: 18, codSurchargeFixed: 30, codSurchargePercent: 1.5 },
];

async function seedRateCards() {
  let created = 0;
  for (const card of RATE_CARDS) {
    const res = await RateCard.updateOne(
      { orderType: card.orderType, tripType: card.tripType, isActive: true },
      { $setOnInsert: { ...card, isActive: true } },
      { upsert: true },
    );
    created += res.upsertedCount;
  }
  console.log(`[seed] RateCards ready: 4 configured (${created} newly created)`);
}

async function main() {
  const adminCfg = seedAdminConfig();
  await connectDB();

  await seedAdmin(adminCfg);
  await seedPincodes();
  await seedRateCards();

  await disconnectDB();
  console.log('[seed] Done.');
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
