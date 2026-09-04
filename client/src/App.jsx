import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Public & Customer Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import Unauthorized from './pages/Unauthorized';
import Menu from './pages/Menu';
import MealDetails from './pages/MealDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import Notifications from './pages/Notifications';

// Code-split Admin Pages (Lazy Loaded on demand)
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminMeals = React.lazy(() => import('./pages/admin/AdminMeals'));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetails = React.lazy(() => import('./pages/admin/AdminOrderDetails'));
const AdminPayments = React.lazy(() => import('./pages/admin/AdminPayments'));
const AdminDelivery = React.lazy(() => import('./pages/admin/AdminDelivery'));
const AdminCustomers = React.lazy(() => import('./pages/admin/AdminCustomers'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top Navbar */}
            <Navbar />

            {/* Page Routing */}
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/menu/:id" element={<MealDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Customer Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>

              {/* Protected Owner / Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/meals" element={<AdminMeals />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />
                <Route path="/admin/delivery" element={<AdminDelivery />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer style={{
            backgroundColor: '#ffffff',
            borderTop: '1px solid var(--border-subtle)',
            padding: '24px 0 clamp(72px, 10vw, 32px) 0',
            marginTop: 'auto',
          }}>
            <div className="container" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
            }}>
              <div>
                <strong>Shree Tiffin Service</strong> — Ghar Jaisa Khana, Har Din.
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                100% Pure Vegetarian • Cooked with Desi Cow Ghee • Indore, Madhya Pradesh
              </div>
            </div>
          </footer>

          {/* Persistent Mobile Bottom Navigation (Visible on Mobile/Tablet <= 768px) */}
          <MobileBottomNav />
        </div>
      </BrowserRouter>
    </CartProvider>
  </AuthProvider>
);
}
