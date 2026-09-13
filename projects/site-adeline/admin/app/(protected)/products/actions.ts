"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createProduct as dbCreateProduct,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  uploadProductImages,
  type ProductInput,
  type ProductStatus,
} from "@/lib/db/products";
import { categories } from "@/lib/categories";
import { logAction } from "@/lib/audit";

export type ProductFormState = { error?: string } | undefined;

function parseInput(formData: FormData): ProductInput | { error: string } {
  const name = formData.get("name");
  const category = formData.get("category");
  const description = formData.get("description");
  const priceEuros = formData.get("price");
  const stock = formData.get("stock");
  const status = formData.get("status");

  if (typeof name !== "string" || !name.trim()) return { error: "Le nom est requis." };
  if (typeof category !== "string" || !categories.some((c) => c.slug === category)) {
    return { error: "Catégorie invalide." };
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

  return {
    name: name.trim(),
    category,
    description: typeof description === "string" ? description.trim() : "",
    price_cents,
    stock: stockNum,
    images: formData.getAll("existingImages").filter((v): v is string => typeof v === "string"),
    status: status as ProductStatus,
  };
}

async function uploadNewImages(formData: FormData): Promise<string[]> {
  const files = formData.getAll("newImages").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return [];
  return uploadProductImages(files);
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
  const product = await dbCreateProduct({ ...parsed, images: [...parsed.images, ...newImages] });
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
  await dbUpdateProduct(id, { ...parsed, images: [...parsed.images, ...newImages] });
  await logAction("product_updated", id);

  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProductAction(id: string): Promise<void> {
  await dbDeleteProduct(id);
  await logAction("product_deleted", id);
  revalidatePath("/products");
}
