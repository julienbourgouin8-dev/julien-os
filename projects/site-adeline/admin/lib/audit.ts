import "server-only";
import { sql, ensureSchema } from "@/lib/db/client";

// Journal d'accountability RGPD (Art. 5(2)) : trace qui a fait quoi sur des
// données personnelles et quand. `detail` reste un résumé (id + action),
// jamais les données personnelles elles-mêmes — le journal ne doit pas
// devenir un nouvel endroit où fuiter ce qu'il est censé auditer.
export async function logAction(action: string, detail = ""): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO audit_log (id, action, detail, created_at)
    VALUES (${crypto.randomUUID()}, ${action}, ${detail}, ${new Date().toISOString()})
  `;
}
