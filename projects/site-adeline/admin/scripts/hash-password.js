#!/usr/bin/env node
// Génère ADMIN_PASSWORD_HASH à coller dans admin/.env.local — équivalent
// local du setup Supabase fait en session (voir PROGRESS.md).
// Usage: node scripts/hash-password.js "<mot de passe choisi>"
const { scryptSync, randomBytes } = require("node:crypto");

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "<mot de passe>"');
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`${salt}:${hash}`);
