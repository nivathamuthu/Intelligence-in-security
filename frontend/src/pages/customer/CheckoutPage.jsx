import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { checkout } from "../../api/orders";
import { useCart } from "../../context/CartContext";
import { Banner, Field, buttonClass, inputClass } from "../../components/ui";
import { apiError, formatMoney } from "../../utils/format";

const EMPTY = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  customer_address: "",
};

function validate(form) {
  const errors = {};
  if (!form.customer_name.trim()) errors.customer_name = "Name is required.";
  if (!form.customer_email.trim()) errors.customer_email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email.trim())) {
    errors.customer_email = "Enter a valid email address.";
  }
  if (form.customer_phone.trim()) {
    const phone = form.customer_phone.trim();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || !/^[0-9+\-().\s]{7,20}$/.test(phone)) {
      errors.customer_phone = "Enter a valid phone number.";
    }
  }
  return errors;
}

export default function CheckoutPage() {
  const { cart, loading, refresh } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    setFormError("");
    try {
      const order = await checkout({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_address: form.customer_address.trim() || null,
      });
      await refresh();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setFormError(apiError(err, "Checkout failed."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-stone-600">Loading checkout…</p>;

  const items = cart?.items || [];
  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="font-serif text-3xl">Checkout</h1>
        <p>Your cart is empty.</p>
        <Link className="text-emerald-800 underline" to="/">
          Return to the shop
        </Link>
      </div>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6" onSubmit={handleSubmit} noValidate>
        <h1 className="font-serif text-3xl">Checkout</h1>
        <Banner>{formError}</Banner>
        <Field label="Name" error={errors.customer_name}>
          <input className={inputClass} value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} />
        </Field>
        <Field label="Email" error={errors.customer_email}>
          <input
            className={inputClass}
            type="email"
            value={form.customer_email}
            onChange={(e) => update("customer_email", e.target.value)}
          />
        </Field>
        <Field label="Phone" error={errors.customer_phone}>
          <input className={inputClass} value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} />
        </Field>
        <Field label="Address">
          <textarea
            className={inputClass}
            rows={3}
            value={form.customer_address}
            onChange={(e) => update("customer_address", e.target.value)}
          />
        </Field>
        <button className={buttonClass} type="submit" disabled={busy}>
          {busy ? "Placing order…" : "Place order"}
        </button>
      </form>
      <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
        <h2 className="font-serif text-2xl">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span>{formatMoney(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-stone-200 pt-3 text-lg font-semibold">
          Grand total {formatMoney(cart.grand_total)}
        </p>
      </aside>
    </section>
  );
}
