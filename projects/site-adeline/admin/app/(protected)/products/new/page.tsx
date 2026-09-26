import ProductForm from "../ProductForm";
import { createProductAction } from "../actions";
import { getProductById } from "@/lib/db/products";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const source = from ? await getProductById(from) : null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Catalogue</p>
      <h1 className="mt-1 font-display text-3xl text-ink">
        {source ? `Nouvelle déclinaison de « ${source.name} »` : "Nouveau produit"}
      </h1>
      <div className="mt-8">
        <ProductForm source={source ?? undefined} action={createProductAction} />
      </div>
    </div>
  );
}
