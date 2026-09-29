import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { Banner, ProductImage, buttonClass, buttonDanger, buttonSecondary } from "../../components/ui";
import { apiError, formatMoney } from "../../utils/format";

export default function CartPage() {
  const { cart, loading, error, updateQuantity, removeItem } = useCart();
  const [actionError, setActionError] = useState("");
  const [pendingId, setPendingId] = useState(null);

  async function change(item, next) {
    setActionError("");
    setPendingId(item.id);
    try {
      if (next < 1) {
        await removeItem(item.id);
      } else {
        await updateQuantity(item.id, next);
      }
    } catch (err) {
      setActionError(apiError(err));
    } finally {
      setPendingId(null);
    }
  }

  if (loading) return <p className="text-stone-600">Loading your cart…</p>;

  const items = cart?.items || [];
  const blocked = items.some((item) => item.status !== "active" || item.quantity > item.available_quantity);

  return (
    <section className="space-y-4">
      <h1 className="font-serif text-3xl">Your cart</h1>
      <Banner>{error || actionError}</Banner>
      {blocked ? (
        <Banner kind="warn">Some items exceed current stock or are no longer available. Update them before checkout.</Banner>
      ) : null}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
          <p className="font-serif text-2xl">Your cart is empty</p>
          <Link className={`${buttonClass} mt-4`} to="/">
            Browse produce
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const over = item.quantity > item.available_quantity || item.status !== "active";
            return (
              <article
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-3 sm:flex-row sm:items-center"
              >
                <ProductImage src={item.image_url} alt="" className="h-24 w-full rounded-xl sm:w-24" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-xl">{item.product_name}</h2>
                  <p className="text-sm text-stone-600">{item.farmer_name}</p>
                  <p className="text-sm text-stone-600">{formatMoney(item.unit_price)} each</p>
                  {over ? (
                    <p className="text-sm text-red-700">
                      {item.status !== "active"
                        ? "No longer available"
                        : `Only ${item.available_quantity} left in stock`}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={buttonSecondary}
                    type="button"
                    disabled={pendingId === item.id || item.quantity <= 1}
                    onClick={() => change(item, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    className={buttonSecondary}
                    type="button"
                    disabled={
                      pendingId === item.id ||
                      item.status !== "active" ||
                      item.quantity >= item.available_quantity
                    }
                    onClick={() => change(item, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 sm:w-40 sm:flex-col sm:items-end">
                  <p className="font-semibold">{formatMoney(item.subtotal)}</p>
                  <button className={buttonDanger} type="button" disabled={pendingId === item.id} onClick={() => change(item, 0)}>
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
          <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl bg-emerald-950 px-4 py-4 text-white sm:flex-row sm:items-center">
            <p className="text-lg">
              Grand total <span className="font-semibold">{formatMoney(cart.grand_total)}</span>
            </p>
            <Link className={`${buttonClass} bg-white text-emerald-950 hover:bg-emerald-50`} to="/checkout">
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
