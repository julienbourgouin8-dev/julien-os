import ProductForm from "../ProductForm";
import { createProductAction } from "../actions";

export default function NewProductPage() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Catalogue</p>
      <h1 className="mt-1 font-display text-3xl text-ink">Nouveau produit</h1>
      <div className="mt-8">
        <ProductForm action={createProductAction} />
      </div>
    </div>
  );
}
