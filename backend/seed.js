import 'dotenv/config';

import { connectDB } from './config/db.js';
import User from './models/User.js';

// Seeds a single ADMIN from environment variables. Idempotent: re-running with
// the same SEED_ADMIN_EMAIL is a no-op on existing matching rows (password is
// NOT overwritten — that would silently invalidate other admins' sessions).
//
// Run with:  npm run seed

async function seedAdmin() {
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

  await connectDB();

  let existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'ADMIN') {
      console.error(
        `[seed] Refusing to overwrite: ${email} exists with role=${existing.role}. Delete the user first or use a different email.`
      );
      process.exit(1);
    }
    console.log(`[seed] Admin already exists: ${email} (id=${existing._id}). No changes made.`);
    process.exit(0);
  }

  const bcrypt = (await import('bcrypt')).default;
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await User.create({
    email,
    passwordHash,
    fullName,
    role: 'ADMIN',
    isEmailVerified: true,
  });

  console.log(`[seed] Created ADMIN: ${admin.email} (id=${admin._id})`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
