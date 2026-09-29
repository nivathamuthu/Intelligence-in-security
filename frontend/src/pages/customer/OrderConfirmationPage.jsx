import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchOrder } from "../../api/orders";
import { Banner } from "../../components/ui";
import { apiError, formatMoney } from "../../utils/format";

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchOrder(id)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch((err) => {
        if (active) setError(apiError(err, "Could not load this order."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <p className="text-stone-600">Loading your order…</p>;
  if (error || !order) return <Banner>{error || "Order not found."}</Banner>;

  const lineSum = order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">Order placed</p>
      <h1 className="font-serif text-3xl">Order #{order.id}</h1>
      <p className="text-stone-600">
        Thank you, {order.customer_name}. A confirmation was recorded for {order.customer_email}.
      </p>
      <ul className="space-y-2">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 text-sm">
            <span>
              {item.product_name} × {item.quantity}
              <span className="block text-stone-500">{formatMoney(item.unit_price)} each</span>
            </span>
            <span>{formatMoney(item.subtotal)}</span>
          </li>
        ))}
      </ul>
      <p className="border-t border-stone-200 pt-3 text-lg font-semibold">Total {formatMoney(order.total_amount)}</p>
      <p className="text-sm text-stone-500">Line subtotals add up to {formatMoney(lineSum)}.</p>
      <Link className="inline-block text-emerald-800 underline" to="/">
        Continue shopping
      </Link>
    </section>
  );
}
