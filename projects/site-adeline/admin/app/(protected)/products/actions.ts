"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createProduct as dbCreateProduct,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  ensureCollection,
  attachToCollection,
  detachFromCollection,
  getProductById,
  uploadProductImages,
  type ProductInput,
  type ProductStatus,
} from "@/lib/db/products";
import { categories } from "@/lib/categories";
import { isValidSubcategory } from "@/lib/subcategories";
import { logAction } from "@/lib/audit";

export type ProductFormState = { error?: string } | undefined;

function parseInput(formData: FormData): ProductInput | { error: string } {
  const name = formData.get("name");
  const category = formData.get("category");
  const subcategoryRaw = formData.get("subcategory");
  const description = formData.get("description");
  const priceEuros = formData.get("price");
  const stock = formData.get("stock");
  const weight = formData.get("weight");
  const status = formData.get("status");

  if (typeof name !== "string" || !name.trim()) return { error: "Le nom est requis." };
  if (typeof category !== "string" || !categories.some((c) => c.slug === category)) {
    return { error: "Catégorie invalide." };
  }
  const subcategory = typeof subcategoryRaw === "string" && subcategoryRaw !== "" ? subcategoryRaw : null;
  if (subcategory !== null && !isValidSubcategory(category, subcategory)) {
    return { error: "Sous-catégorie invalide pour cette catégorie." };
  }
  if (typeof status !== "string" || !["draft", "active", "archived"].includes(status)) {
    return { error: "Statut invalide." };
  }

  const price_cents =
    typeof priceEuros === "string" && priceEuros.trim() !== ""
      ? Math.round(parseFloat(priceEuros.replace(",", ".")) * 100)
      : null;
  if (price_cents !== null && Number.isNaN(price_cents)) return { error: "Prix invalide." };

  const stockNum = typeof stock === "string" ? parseInt(stock, 10) : 0;
  if (Number.isNaN(stockNum) || stockNum < 0) return { error: "Stock invalide." };

  const weight_grams =
    typeof weight === "string" && weight.trim() !== "" ? Math.round(parseFloat(weight)) : null;
  if (weight_grams !== null && (Number.isNaN(weight_grams) || weight_grams < 0)) {
    return { error: "Poids invalide." };
  }

  return {
    name: name.trim(),
    category,
    subcategory,
    collection_id: null,
    variant_label: null,
    description: typeof description === "string" ? description.trim() : "",
    price_cents,
    stock: stockNum,
    weight_grams,
    // dédoublonné : une même photo listée deux fois faussait la photo principale
    images: Array.from(new Set(formData.getAll("existingImages").filter((v): v is string => typeof v === "string"))),
    status: status as ProductStatus,
  };
}

async function uploadNewImages(formData: FormData): Promise<string[]> {
  const files = formData.getAll("newImages").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return [];
  return uploadProductImages(files);
}

// Ordre final des photos = ordre choisi dans le formulaire (glisser-déposer) :
// `photoOrder` est un JSON de jetons "e:<url>" (photo déjà enregistrée) ou
// "n:<index>" (index dans les fichiers envoyés). La première est la photo
// principale de la boutique. Tout ce qui manque dans la liste est ajouté à
// la fin plutôt que perdu.
function orderImages(existingImages: string[], newImages: string[], formData: FormData): string[] {
  const all = [...existingImages, ...newImages];
  const raw = formData.get("photoOrder");
  let tokens: unknown = [];
  try {
    tokens = typeof raw === "string" ? JSON.parse(raw) : [];
  } catch {
    tokens = [];
  }

  const ordered: string[] = [];
  for (const token of Array.isArray(tokens) ? tokens : []) {
    if (typeof token !== "string") continue;
    let url: string | undefined;
    if (token.startsWith("e:")) url = existingImages.find((u) => u === token.slice(2));
    else if (token.startsWith("n:")) url = newImages[Number.parseInt(token.slice(2), 10)];
    if (url && !ordered.includes(url)) ordered.push(url);
  }
  return [...ordered, ...all.filter((u) => !ordered.includes(u))];
}

export async function createProductAction(
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseInput(formData);
  if ("error" in parsed) return parsed;
  let newImages: string[];
  try {
    newImages = await uploadNewImages(formData);
  } catch (err) {
    return { error: (err as Error).message };
  }
  // Création d'une déclinaison depuis « + Ajouter une déclinaison » : le
  // produit source entre (si besoin) dans une collection, et la nouvelle
  // pièce y est rattachée en reprenant ses champs communs.
  let collectionId: string | null = null;
  let shared: Partial<typeof parsed> = {};
  const fromId = formData.get("fromProductId");
  if (typeof fromId === "string" && fromId) {
    const source = await getProductById(fromId);
    if (!source) return { error: "Le produit d'origine est introuvable." };
    collectionId = await ensureCollection(fromId);
    shared = {
      category: source.category,
      subcategory: source.subcategory,
      description: source.description,
      price_cents: source.price_cents,
      weight_grams: source.weight_grams,
    };
  }
  const product = await dbCreateProduct({
    ...parsed,
    ...shared,
    collection_id: collectionId,
    images: orderImages(parsed.images, newImages, formData),
  });
  await logAction("product_created", product.id);

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProductAction(
  id: string,
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseInput(formData);
  if ("error" in parsed) return parsed;
  let newImages: string[];
  try {
    newImages = await uploadNewImages(formData);
  } catch (err) {
    return { error: (err as Error).message };
  }
  await dbUpdateProduct(id, {
    ...parsed,
    images: orderImages(parsed.images, newImages, formData),
  });
  await logAction("product_updated", id);

  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProductAction(id: string): Promise<void> {
  await dbDeleteProduct(id);
  await logAction("product_deleted", id);
  revalidatePath("/products");
}

export async function attachProductAction(currentId: string, formData: FormData): Promise<void> {
  const other = formData.get("otherProductId");
  if (typeof other !== "string" || !other) return;
  await attachToCollection(other, currentId);
  await logAction("product_attached_to_collection", other);
  revalidatePath("/products");
  redirect(`/products/${currentId}/edit`);
}

export async function detachProductAction(id: string): Promise<void> {
  await detachFromCollection(id);
  await logAction("product_detached_from_collection", id);
  revalidatePath("/products");
  redirect(`/products/${id}/edit`);
}
