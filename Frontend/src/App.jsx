import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Crops from './pages/Crops';
import CropDetail from './pages/CropDetail';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Disease from './pages/Disease';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Shopkeeper from './pages/Shopkeeper';
import AdminLogin from './pages/AdminLogin';
import ShopkeeperProductDetail from './pages/ShopkeeperProductDetail';
import AdminPanel from './pages/AdminPanel';
import ShopkeeperPaymentPage from './pages/ShopkeeperPaymentPage';

import './assets/styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/:type" element={<Register />} />
            <Route path="/crops" element={<Crops />} />
            <Route path="/crops/:id" element={<CropDetail />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/products/:id" element={<ProductDetail />} />
            <Route path="/shop/shopkeeper-products/:id" element={<ShopkeeperProductDetail />} />

            {/* Protected – any logged-in user */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Protected – farmer only */}
            <Route path="/disease" element={<ProtectedRoute allowedRoles={['farmer']}><Disease /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute allowedRoles={['farmer']}><Cart /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute allowedRoles={['farmer']}><Orders /></ProtectedRoute>} />
            <Route path="/shopkeeper-payment/:orderId" element={<ProtectedRoute allowedRoles={['farmer']}><ShopkeeperPaymentPage /></ProtectedRoute>} />

            {/* Protected – shopkeeper only */}
            <Route path="/shopkeeper" element={<ProtectedRoute allowedRoles={['shopkeeper']}><Shopkeeper /></ProtectedRoute>} />

            {/* Admin pages */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
