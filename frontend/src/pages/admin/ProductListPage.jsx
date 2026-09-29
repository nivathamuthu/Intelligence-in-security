import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { deleteProduct, fetchProducts, updateProductStatus, updateProductStock } from "../../api/products";
import { Banner, buttonClass, buttonDanger, buttonSecondary, inputClass } from "../../components/ui";
import { apiError, formatMoney } from "../../utils/format";

export default function ProductListPage() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");
  const [stockDrafts, setStockDrafts] = useState({});
  const [pendingId, setPendingId] = useState(null);
  const [confirming, setConfirming] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchProducts({ admin: true, search: search.trim(), category });
      setProducts(rows);
      setStockDrafts(Object.fromEntries(rows.map((row) => [row.id, String(row.available_quantity)])));
      if (!search.trim() && !category) {
        setCategories([...new Set(rows.map((row) => row.category))].sort());
      }
    } catch (err) {
      setError(apiError(err, "Could not load products."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  async function toggleStatus(product) {
    setPendingId(product.id);
    setError("");
    try {
      const next = product.status === "active" ? "inactive" : "active";
      await updateProductStatus(product.id, next);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not update status."));
    } finally {
      setPendingId(null);
    }
  }

  async function saveStock(product) {
    const raw = stockDrafts[product.id] ?? "";
    if (!/^\d+$/.test(raw.trim())) {
      setError("Stock must be a whole number, 0 or more.");
      return;
    }
    setPendingId(product.id);
    setError("");
    try {
      await updateProductStock(product.id, Number(raw));
      setNotice("Stock updated.");
      await load();
    } catch (err) {
      setError(apiError(err, "Could not update stock."));
    } finally {
      setPendingId(null);
    }
  }

  async function confirmDelete() {
    if (!confirming) return;
    setPendingId(confirming.id);
    setError("");
    try {
      await deleteProduct(confirming.id);
      setNotice(`Deleted ${confirming.name}.`);
      setConfirming(null);
      await load();
    } catch (err) {
      setError(apiError(err, "Could not delete the product."));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-3xl">Products</h1>
        <Link className={buttonClass} to="/admin/products/new">
          Add product
        </Link>
      </div>
      <Banner kind="success">{notice}</Banner>
      <Banner>{error}</Banner>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className={inputClass}
          placeholder="Search by name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search products"
        />
        <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {loading ? <p className="text-stone-600">Loading products…</p> : null}
      {!loading && products.length === 0 ? <p className="text-stone-600">No products match these filters.</p> : null}

      <div className="hidden overflow-x-auto rounded-2xl border border-stone-200 bg-white md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-stone-200 text-stone-500">
            <tr>
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Farmer</th>
              <th className="px-3 py-3 font-medium">Price</th>
              <th className="px-3 py-3 font-medium">Stock</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-stone-100 align-top">
                <td className="px-3 py-3 font-medium">{product.name}</td>
                <td className="px-3 py-3">{product.category}</td>
                <td className="px-3 py-3">{product.farmer_name}</td>
                <td className="px-3 py-3">{formatMoney(product.price)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      className={`${inputClass} w-20`}
                      value={stockDrafts[product.id] ?? ""}
                      onChange={(event) =>
                        setStockDrafts((current) => ({ ...current, [product.id]: event.target.value }))
                      }
                    />
                    <button className={buttonSecondary} type="button" disabled={pendingId === product.id} onClick={() => saveStock(product)}>
                      Save
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3 capitalize">{product.status}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button className={buttonSecondary} type="button" disabled={pendingId === product.id} onClick={() => toggleStatus(product)}>
                      {product.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <Link className={buttonSecondary} to={`/admin/products/${product.id}/edit`}>
                      Edit
                    </Link>
                    <button className={buttonDanger} type="button" onClick={() => setConfirming(product)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {products.map((product) => (
          <article key={product.id} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div>
              <h2 className="font-serif text-xl">{product.name}</h2>
              <p className="text-sm text-stone-600">
                {product.category} · {product.farmer_name}
              </p>
              <p className="mt-1">{formatMoney(product.price)}</p>
              <p className="text-sm capitalize text-stone-600">{product.status}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                className={inputClass}
                aria-label={`Stock for ${product.name}`}
                value={stockDrafts[product.id] ?? ""}
                onChange={(event) => setStockDrafts((current) => ({ ...current, [product.id]: event.target.value }))}
              />
              <button className={buttonSecondary} type="button" disabled={pendingId === product.id} onClick={() => saveStock(product)}>
                Save stock
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={buttonSecondary} type="button" disabled={pendingId === product.id} onClick={() => toggleStatus(product)}>
                {product.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <Link className={buttonSecondary} to={`/admin/products/${product.id}/edit`}>
                Edit
              </Link>
              <button className={buttonDanger} type="button" onClick={() => setConfirming(product)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {confirming ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-stone-900/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" role="dialog" aria-modal="true">
            <h2 className="font-serif text-2xl">Delete {confirming.name}?</h2>
            <p className="mt-2 text-sm text-stone-600">This cannot be undone. Products already on an order cannot be deleted.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className={buttonSecondary} type="button" onClick={() => setConfirming(null)}>
                Cancel
              </button>
              <button className={buttonDanger} type="button" disabled={pendingId === confirming.id} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
