import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/admin/LoginPage";
import ProductListPage from "../pages/admin/ProductListPage";
import AddProductPage from "../pages/admin/AddProductPage";
import EditProductPage from "../pages/admin/EditProductPage";
import OrdersPage from "../pages/admin/OrdersPage";
import ProductListingPage from "../pages/customer/ProductListingPage";
import ProductDetailsPage from "../pages/customer/ProductDetailsPage";
import CartPage from "../pages/customer/CartPage";
import CheckoutPage from "../pages/customer/CheckoutPage";
import OrderConfirmationPage from "../pages/customer/OrderConfirmationPage";
import AdminProtectedRoute from "./AdminProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProductListingPage />} />
      <Route path="/products/:id" element={<ProductDetailsPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders/:id" element={<OrderConfirmationPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin/products"
        element={
          <AdminProtectedRoute>
            <ProductListPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/products/new"
        element={
          <AdminProtectedRoute>
            <AddProductPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/products/:id/edit"
        element={
          <AdminProtectedRoute>
            <EditProductPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminProtectedRoute>
            <OrdersPage />
          </AdminProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
