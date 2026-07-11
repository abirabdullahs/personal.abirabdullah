// One-time helper script — NOT part of the app runtime.
// Run with: node scripts/hash-password.js "your-plain-password"
// Copy the printed hash and paste it into Supabase -> admin table -> password column.

const bcrypt = require('bcrypt');

const plainPassword = process.argv[2];

if (!plainPassword) {
  console.error('Usage: node scripts/hash-password.js "your-plain-password"');
  process.exit(1);
}

bcrypt.hash(plainPassword, 10).then((hash) => {
  console.log('\nBcrypt hash (paste this into the admin.password column in Supabase):\n');
  console.log(hash);
  console.log('');
});
