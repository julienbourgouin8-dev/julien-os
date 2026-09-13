import { notFound } from "next/navigation";
import ProductForm from "../../ProductForm";
import { updateProductAction } from "../../actions";
import { getProductById } from "@/lib/db/products";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Catalogue</p>
      <h1 className="mt-1 font-display text-3xl text-ink">Modifier {product.name}</h1>
      <div className="mt-8">
        <ProductForm product={product} action={updateProductAction.bind(null, id)} />
      </div>
    </div>
  );
}
