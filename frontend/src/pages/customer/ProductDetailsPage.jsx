import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProduct } from "../../api/products";
import { useCart } from "../../context/CartContext";
import { Banner, ProductImage, buttonClass, inputClass } from "../../components/ui";
import { apiError, formatMoney } from "../../utils/format";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchProduct(id)
      .then((data) => {
        if (!active) return;
        setProduct(data);
        setQuantity(data.available_quantity > 0 ? 1 : 0);
      })
      .catch((err) => {
        if (active) setError(apiError(err, "Product not found."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  function changeQuantity(value) {
    const max = product?.available_quantity ?? 0;
    const next = Number(value);
    if (!Number.isInteger(next)) return;
    if (next < 1) {
      setQuantity(max > 0 ? 1 : 0);
      return;
    }
    setQuantity(Math.min(next, max));
  }

  async function handleAdd() {
    setActionError("");
    setBusy(true);
    try {
      await addToCart(product.id, quantity);
    } catch (err) {
      setActionError(apiError(err, "Could not add this product."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-stone-600">Loading product…</p>;
  if (error || !product) {
    return (
      <div className="space-y-3">
        <Banner>{error || "Product not found."}</Banner>
        <Link className="text-emerald-800 underline" to="/">
          Back to the shop
        </Link>
      </div>
    );
  }

  const out = product.available_quantity <= 0;

  return (
    <article className="grid gap-6 lg:grid-cols-2">
      <ProductImage src={product.image_url} alt={product.name} className="h-72 w-full rounded-2xl sm:h-96" />
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">{product.category}</p>
        <h1 className="font-serif text-4xl">{product.name}</h1>
        <p className="text-stone-600">Grown by {product.farmer_name}</p>
        <p className="text-2xl font-semibold">{formatMoney(product.price)}</p>
        <p className={out ? "text-red-700" : "text-stone-700"}>
          {out ? "Out of stock" : `${product.available_quantity} available`}
        </p>
        {product.description ? <p className="leading-relaxed text-stone-700">{product.description}</p> : null}
        <Banner>{actionError}</Banner>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">Quantity</span>
            <input
              className={`${inputClass} w-24`}
              type="number"
              min={out ? 0 : 1}
              max={product.available_quantity}
              value={quantity}
              disabled={out}
              onChange={(event) => changeQuantity(event.target.value)}
            />
          </label>
          <button className={buttonClass} type="button" disabled={out || busy || quantity < 1} onClick={handleAdd}>
            {busy ? "Adding…" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
