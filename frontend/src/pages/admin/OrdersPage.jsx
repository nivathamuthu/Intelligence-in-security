import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOrders } from "../../api/orders";
import { Banner } from "../../components/ui";
import { apiError, formatMoney } from "../../utils/format";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchOrders()
      .then((rows) => {
        if (active) setOrders(rows);
      })
      .catch((err) => {
        if (active) setError(apiError(err, "Could not load orders."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="font-serif text-3xl">Orders</h1>
      <Banner>{error}</Banner>
      {loading ? <p className="text-stone-600">Loading orders…</p> : null}
      {!loading && !error && orders.length === 0 ? <p className="text-stone-600">No orders yet.</p> : null}
      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-serif text-xl">
                <Link className="underline" to={`/orders/${order.id}`}>
                  Order #{order.id}
                </Link>
              </h2>
              <p className="font-semibold">{formatMoney(order.total_amount)}</p>
            </div>
            <p className="text-sm text-stone-600">
              {order.customer_name} · {order.customer_email}
            </p>
            <p className="text-sm capitalize text-stone-500">
              {order.status} · {new Date(order.created_at).toLocaleString()} · {order.items.length} lines
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
