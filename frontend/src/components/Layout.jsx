import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Layout({ children }) {
  const { isAuthenticated, logout } = useAuth();
  const { itemCount, notice } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-serif text-2xl text-emerald-950">
            Farmer Cart
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm sm:gap-4">
            <Link className="rounded-lg px-2 py-1 hover:bg-stone-100" to="/">
              Shop
            </Link>
            <Link className="rounded-lg px-2 py-1 hover:bg-stone-100" to="/cart">
              Cart
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-800 px-1.5 py-0.5 text-xs text-white">
                {itemCount}
              </span>
            </Link>
            {isAuthenticated ? (
              <>
                <Link className="rounded-lg px-2 py-1 hover:bg-stone-100" to="/admin/products">
                  Products
                </Link>
                <Link className="rounded-lg px-2 py-1 hover:bg-stone-100" to="/admin/orders">
                  Orders
                </Link>
                <button className="rounded-lg px-2 py-1 hover:bg-stone-100" type="button" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <Link className="rounded-lg px-2 py-1 hover:bg-stone-100" to="/admin/login">
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>
      {notice ? (
        <div className="mx-auto mt-3 w-full max-w-6xl px-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {notice}
          </div>
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
        Produce from nearby farms, packed the day you order.
      </footer>
    </div>
  );
}
