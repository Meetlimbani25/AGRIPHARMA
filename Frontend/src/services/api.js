import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api' });

export const BACKEND_URL = process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, '') 
  : 'http://localhost:5000';

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const registerFarmer = (data) => API.post('/auth/register', data);
export const loginFarmer = (data) => API.post('/auth/login', data);
export const getProfile = () => API.get('/auth/profile');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const registerShopkeeper = (data) => API.post('/auth/shopkeeper/register', data);
export const loginShopkeeper = (data) => API.post('/auth/shopkeeper/login', data);
export const requestPasswordResetOtp = (data) => API.post('/auth/forgot-password/send-otp', data);
export const resetPasswordWithOtp = (data) => API.post('/auth/forgot-password/verify-reset', data);
export const googleLogin = (data) => API.post('/auth/google', data);

// Crops
export const getCrops = (season) => API.get('/crops', season ? { params: { season } } : {});
export const getCropById = (id) => API.get(`/crops/${id}`);
export const getCropSchedule = (id, week) => API.get(`/crops/${id}/schedule`, { params: { week } });

// Shop
export const getProducts = (params) => API.get('/shop/products', { params });
export const getProductById = (id) => API.get(`/shop/products/${id}`);
export const getProductReviews = (id) => API.get(`/shop/products/${id}/reviews`);
export const addProductReview = (id, data) => API.post(`/shop/products/${id}/reviews`, data);
export const getSeeds = (params) => API.get('/shop/seeds', { params });
export const getShopkeeperProducts = (params) => API.get('/shop/shopkeeper-products', { params });

// Shopkeeper
export const getMyShopkeeperProducts = () => API.get('/shopkeeper/products');
export const addShopkeeperProduct = (formData) => API.post('/shopkeeper/products', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateShopkeeperProduct = (id, data) => API.put(`/shopkeeper/products/${id}`, data);
export const deleteShopkeeperProduct = (id) => API.delete(`/shopkeeper/products/${id}`);
export const getShopkeeperIncomingOrders = (params) => API.get('/shopkeeper/orders', { params });
export const updateShopkeeperOrderStatus = (id, status) => API.put(`/shopkeeper/orders/${id}/status`, { status });
export const updateShopkeeperUpi = (data) => API.put('/shopkeeper/update-upi', data);
export const updateShopkeeperInvoiceSettings = (data) => API.put('/shopkeeper/invoice-settings', data);
export const updateShopkeeperProfilePicture = (formData) => API.put('/shopkeeper/profile-picture', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Cart
export const getCart = () => API.get('/cart');
export const addToCart = (data) => API.post('/cart/add', data);
export const addToShopCart = (data) => API.post('/cart/add-shopkeeper', data);
export const updateCartItem = (id, qty, cart_type = 'admin') => API.put('/cart/update', { cart_id: id, quantity: qty, cart_type });
export const removeFromCart = (id) => API.delete(`/cart/remove/${id}`, { params: { cart_type: 'admin' } });
export const removeFromShopCart = (id) => API.delete(`/cart/remove/${id}`, { params: { cart_type: 'shopkeeper' } });
export const clearCart = (cart_type = 'admin') => API.delete('/cart/clear', { params: { cart_type } });

// Orders
export const placeOrder = (data) => API.post('/orders', data);
export const placeShopkeeperOrder = (data) => API.post('/orders/shopkeeper', data);
export const getMyOrders = () => API.get('/orders/my');
export const getMyShopkeeperOrders = () => API.get('/orders/shopkeeper/my');
export const getOrderById = (id) => API.get(`/orders/${id}`);
export const deleteOrder = (id) => API.delete(`/orders/${id}`);
export const deleteShopkeeperOrder = (id) => API.delete(`/orders/shopkeeper/${id}`);

// Payments
export const createPayment = (data) => API.post('/payments/pay', data);
export const createShopkeeperPayment = (data) => API.post('/payments/pay-shopkeeper', data);
export const getPaymentHistory = () => API.get('/payments/history');
export const getShopkeeperQr = (orderId) => API.get(`/payments/shopkeeper-qr/${orderId}`);
export const confirmShopkeeperPayment = (data) => API.post('/payments/confirm-shopkeeper-payment', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Disease Detection
export const detectDisease = (formData) => API.post('/disease/detect', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getDiseaseHistory = () => API.get('/disease/history');
export const getScanById = (id) => API.get(`/disease/history/${id}`);

// Admin
export const adminLogin = (data) => API.post('/auth/admin/login', data);
export const getAdminShopkeepers = () => API.get('/admin/shopkeepers');
export const updateShopkeeperApproval = (id, approve) => API.put(`/admin/shopkeepers/${id}/approval`, { approve });


export const getShopkeeperProductById = (id) => API.get(`/shop/shopkeeper-products/${id}`);
export const getShopkeeperProductReviews = (id) => API.get(`/shop/shopkeeper-products/${id}/reviews`);
export const addShopkeeperProductReview = (id, data) => API.post(`/shop/shopkeeper-products/${id}/reviews`, data);

export default API;
