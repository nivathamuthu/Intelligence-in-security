import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../api/products";
import ProductForm from "../../components/ProductForm";

export default function AddProductPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(payload) {
    setBusy(true);
    try {
      await createProduct(payload);
      navigate("/admin/products", { state: { notice: "Product created." } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-serif text-3xl">Add product</h1>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
        <ProductForm submitLabel="Create product" onSubmit={handleSubmit} busy={busy} />
      </div>
    </section>
  );
}
