import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

// Common components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminSidebar from './components/AdminSidebar';

// Customer pages
import Home from './pages/customer/Home';
import ProductCatalog from './pages/customer/ProductCatalog';
import ProductDetail from './pages/customer/ProductDetail';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderConfirmation from './pages/customer/OrderConfirmation';
import MyOrdersPage from './pages/customer/MyOrdersPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import ProfilePage from './pages/customer/ProfilePage';
import LoginPage from './pages/customer/LoginPage';
import RegisterPage from './pages/customer/RegisterPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/customer/ForgotPasswordPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDeliveryConfig from './pages/admin/AdminDeliveryConfig';
import AdminPayments from './pages/admin/AdminPayments';

import { useLocation } from 'react-router-dom';

// Customer Layout Wrapper
function CustomerLayout() {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f6] text-neutral-900 selection:bg-neutral-900 selection:text-white w-full max-w-full min-w-0 overflow-x-hidden">
      <Navbar />
      <main key={location.pathname} className="flex-1 animate-page-enter w-full max-w-full min-w-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Admin Layout Wrapper
function AdminLayout() {
  const location = useLocation();
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950">
      <AdminSidebar />
      <main key={location.pathname} className="flex-1 overflow-x-hidden pt-16 lg:pt-0 animate-page-enter">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            {/* Customer Storefront Routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductCatalog />} />
              <Route path="/products/:identifier" element={<ProductDetail />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />

              {/* Customer Protected Routes */}
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-confirmation/:orderId"
                element={
                  <ProtectedRoute>
                    <OrderConfirmation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-orders"
                element={
                  <ProtectedRoute>
                    <MyOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Dedicated Admin Portal Routes */}
            <Route
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/delivery-config" element={<AdminDeliveryConfig />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
