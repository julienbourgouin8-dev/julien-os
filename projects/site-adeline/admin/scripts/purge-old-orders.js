#!/usr/bin/env node
// RGPD Art. 5(1)(e) — conservation limitée. Efface email + adresse de
// livraison des commandes de plus de 3 ans (durée recommandée CNIL pour les
// données de relation commerciale une fois celle-ci terminée), sans toucher
// aux champs comptables (montant, articles, statut, dates) qui doivent eux
// rester 10 ans (Code de commerce). À lancer manuellement de temps en temps
// (pas de cron en place) — voir registre des traitements pour la politique
// complète.
// Usage: node scripts/purge-old-orders.js [--dry-run]
const path = require("node:path");
const { randomUUID } = require("node:crypto");

process.loadEnvFile(path.join(__dirname, "..", ".env.local"));

const { neon } = require("@neondatabase/serverless");

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("DATABASE_URL (ou POSTGRES_URL) manquant dans .env.local");
  process.exit(1);
}
const sql = neon(connectionString);

const RETENTION_YEARS = 3;
const dryRun = process.argv.includes("--dry-run");

(async () => {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - RETENTION_YEARS);
  const cutoffIso = cutoff.toISOString();

  const rows = await sql`
    SELECT id, created_at FROM orders
    WHERE created_at < ${cutoffIso} AND (customer_email IS NOT NULL OR shipping_address IS NOT NULL)
  `;

  if (rows.length === 0) {
    console.log("Rien à purger — aucune commande de plus de 3 ans avec des données personnelles encore présentes.");
    return;
  }

  console.log(`${rows.length} commande(s) de plus de ${RETENTION_YEARS} ans avec des données personnelles :`);
  for (const row of rows) console.log(`  - ${row.id} (${row.created_at})`);

  if (dryRun) {
    console.log("\n--dry-run : rien n'a été modifié.");
    return;
  }

  const now = new Date().toISOString();
  for (const row of rows) {
    await sql`UPDATE orders SET customer_email = NULL, shipping_address = NULL, updated_at = ${now} WHERE id = ${row.id}`;
    await sql`INSERT INTO audit_log (id, action, detail, created_at) VALUES (${randomUUID()}, 'order_anonymized_purge', ${row.id}, ${now})`;
  }

  console.log(`\n${rows.length} commande(s) anonymisée(s).`);
})();
