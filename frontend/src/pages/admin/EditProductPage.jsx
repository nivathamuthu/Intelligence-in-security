import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchProduct, updateProduct } from "../../api/products";
import ProductForm from "../../components/ProductForm";
import { Banner } from "../../components/ui";
import { apiError } from "../../utils/format";

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetchProduct(id, { admin: true })
      .then((data) => {
        if (active) setProduct(data);
      })
      .catch((err) => {
        if (active) setError(apiError(err, "Could not load this product."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(payload) {
    setBusy(true);
    try {
      await updateProduct(id, payload);
      navigate("/admin/products", { state: { notice: "Product updated." } });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-stone-600">Loading product…</p>;
  if (error || !product) {
    return (
      <div className="space-y-3">
        <Banner>{error || "Product not found."}</Banner>
        <Link className="text-emerald-800 underline" to="/admin/products">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-serif text-3xl">Edit {product.name}</h1>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
        <ProductForm initial={product} submitLabel="Save changes" onSubmit={handleSubmit} busy={busy} />
      </div>
    </section>
  );
}
