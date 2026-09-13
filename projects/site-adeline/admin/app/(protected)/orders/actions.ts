"use server";

import { revalidatePath } from "next/cache";
import { markOrderFulfilled, anonymizeOrder } from "@/lib/db/orders";
import { logAction } from "@/lib/audit";

export async function markOrderFulfilledAction(id: string): Promise<void> {
  await markOrderFulfilled(id);
  await logAction("order_fulfilled", id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
}

// RGPD Art. 17 (droit à l'effacement) : bouton pour répondre à une demande
// cliente sans attendre la purge périodique.
export async function anonymizeOrderAction(id: string): Promise<void> {
  await anonymizeOrder(id);
  await logAction("order_anonymized", id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
}
