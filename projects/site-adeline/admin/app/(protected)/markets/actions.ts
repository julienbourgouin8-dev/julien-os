"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createMarket as dbCreateMarket,
  updateMarket as dbUpdateMarket,
  deleteMarket as dbDeleteMarket,
  type MarketInput,
} from "@/lib/db/markets";
import { saveGenericImage } from "@/lib/uploads";
import { logAction } from "@/lib/audit";

export type MarketFormState = { error?: string } | undefined;

function parseInput(formData: FormData): MarketInput | { error: string } {
  const title = formData.get("title");
  const place = formData.get("place");
  const eventDate = formData.get("event_date");
  const existingImage = formData.get("existingImage");

  if (typeof title !== "string" || !title.trim()) return { error: "Le titre est requis." };
  if (typeof place !== "string" || !place.trim()) return { error: "Le lieu est requis." };

  return {
    title: title.trim(),
    place: place.trim(),
    event_date: typeof eventDate === "string" && eventDate !== "" ? eventDate : null,
    image: typeof existingImage === "string" && existingImage !== "" ? existingImage : null,
  };
}

async function uploadNewImage(formData: FormData): Promise<string | null> {
  const file = formData.get("newImage");
  if (!(file instanceof File) || file.size === 0) return null;
  return saveGenericImage(file);
}

export async function createMarketAction(
  _state: MarketFormState,
  formData: FormData,
): Promise<MarketFormState> {
  const parsed = parseInput(formData);
  if ("error" in parsed) return parsed;
  let newImage: string | null;
  try {
    newImage = await uploadNewImage(formData);
  } catch (err) {
    return { error: (err as Error).message };
  }
  const market = await dbCreateMarket({ ...parsed, image: newImage ?? parsed.image });
  await logAction("market_created", market.id);

  revalidatePath("/markets");
  redirect("/markets");
}

export async function updateMarketAction(
  id: string,
  _state: MarketFormState,
  formData: FormData,
): Promise<MarketFormState> {
  const parsed = parseInput(formData);
  if ("error" in parsed) return parsed;
  let newImage: string | null;
  try {
    newImage = await uploadNewImage(formData);
  } catch (err) {
    return { error: (err as Error).message };
  }
  await dbUpdateMarket(id, { ...parsed, image: newImage ?? parsed.image });
  await logAction("market_updated", id);

  revalidatePath("/markets");
  redirect("/markets");
}

export async function deleteMarketAction(id: string): Promise<void> {
  await dbDeleteMarket(id);
  await logAction("market_deleted", id);
  revalidatePath("/markets");
}
