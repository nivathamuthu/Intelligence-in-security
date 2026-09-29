import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as cartApi from "../api/cart";
import { apiError } from "../utils/format";

const CartContext = createContext(null);

function ensureSession() {
  let id = localStorage.getItem("cart_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cart_session_id", id);
  }
  return id;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    ensureSession();
    const data = await cartApi.getCart();
    setCart(data);
    return data;
  }, []);

  useEffect(() => {
    let active = true;
    refresh()
      .catch((err) => {
        if (active) setError(apiError(err, "Could not load your cart."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    setError("");
    const data = await cartApi.addItem({ product_id: productId, quantity });
    setCart(data);
    setNotice("Added to cart");
    return data;
  }, []);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    setError("");
    const data = await cartApi.updateItem(itemId, { quantity });
    setCart(data);
    return data;
  }, []);

  const removeItem = useCallback(async (itemId) => {
    setError("");
    const data = await cartApi.removeItem(itemId);
    setCart(data);
    return data;
  }, []);

  const itemCount = useMemo(
    () => (cart?.items || []).reduce((sum, item) => sum + Number(item.quantity), 0),
    [cart],
  );

  const value = {
    cart,
    loading,
    error,
    setError,
    notice,
    itemCount,
    refresh,
    addToCart,
    updateQuantity,
    removeItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
