import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories, fetchProducts } from "../../api/products";
import { useCart } from "../../context/CartContext";
import { Banner, ProductImage, buttonClass, inputClass } from "../../components/ui";
import { apiError, formatMoney } from "../../utils/format";

export default function ProductListingPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((rows) => {
        if (active) setCategories(rows);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchProducts({ search, category })
      .then((rows) => {
        if (active) setProducts(rows);
      })
      .catch((err) => {
        if (active) setError(apiError(err, "Could not load products."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, category]);

  async function handleAdd(product) {
    setActionError("");
    setPendingId(product.id);
    try {
      await addToCart(product.id, 1);
    } catch (err) {
      setActionError(apiError(err, "Could not add this product."));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">From the farm</p>
          <h1 className="font-serif text-3xl text-stone-900 sm:text-4xl">This week’s harvest</h1>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <input
            className={`${inputClass} sm:w-64`}
            placeholder="Search by name"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search products"
          />
          <select
            className={`${inputClass} sm:w-48`}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-4">
        <Banner>{error || actionError}</Banner>
      </div>
      {loading ? <p className="text-stone-600">Loading products…</p> : null}
      {!loading && !error && products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
          <p className="font-serif text-2xl">No matching produce</p>
          <p className="mt-2 text-stone-600">Try another name or category.</p>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const out = product.available_quantity <= 0;
          return (
            <article key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <Link to={`/products/${product.id}`}>
                <ProductImage src={product.image_url} alt={product.name} className="h-48 w-full" />
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">{product.category}</p>
                <Link to={`/products/${product.id}`} className="font-serif text-xl">
                  {product.name}
                </Link>
                <p className="text-sm text-stone-600">Grown by {product.farmer_name}</p>
                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                  <div>
                    <p className="text-lg font-semibold">{formatMoney(product.price)}</p>
                    <p className={`text-sm ${out ? "text-red-700" : "text-stone-600"}`}>
                      {out ? "Out of stock" : `${product.available_quantity} in stock`}
                    </p>
                  </div>
                  <button
                    className={buttonClass}
                    type="button"
                    disabled={out || pendingId === product.id}
                    onClick={() => handleAdd(product)}
                  >
                    {pendingId === product.id ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
