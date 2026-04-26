import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyShopkeeperProducts, addShopkeeperProduct, updateShopkeeperProduct, deleteShopkeeperProduct, getShopkeeperIncomingOrders, updateShopkeeperOrderStatus } from '../services/api';
import { generateInvoice } from '../utils/generateInvoice';
import './Shopkeeper.css';

export default function Shopkeeper() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    price_unit: 'kg',
    stock: '',
    description: '',
    image: null,
    discount_price: '',
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // UPI Form
  const [upiForm, setUpiForm] = useState({ upi_id: '', upi_name: '' });
  const [upiMsg, setUpiMsg] = useState({ type: '', text: '' });

  // Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({ bank_name: '', bank_account_number: '', bank_ifsc: '', invoice_terms: '', gst_number: '' });
  const [invoiceMsg, setInvoiceMsg] = useState({ type: '', text: '' });

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const { updateShopkeeperProfilePicture } = require('../services/api');
      const res = await updateShopkeeperProfilePicture(formData);
      const updatedUser = { ...user, profile_picture: res.data.profile_picture };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('Profile picture updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile picture');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    if (user?.role === 'shopkeeper') {
      import('../services/api').then(api => {
        api.getProfile().then(res => {
          if (res.data.shopkeeper) {
            setUpiForm({
              upi_id: res.data.shopkeeper.upi_id || '',
              upi_name: res.data.shopkeeper.upi_name || ''
            });
            setInvoiceForm({
              bank_name: res.data.shopkeeper.bank_name || '',
              bank_account_number: res.data.shopkeeper.bank_account_number || '',
              bank_ifsc: res.data.shopkeeper.bank_ifsc || '',
              invoice_terms: res.data.shopkeeper.invoice_terms || '',
              gst_number: res.data.shopkeeper.gst_number || ''
            });
          }
        });
      });
    }
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyShopkeeperProducts();
      setProducts(res.data.products || []);
    } catch (e) {
      setError((e.response?.data?.message) || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };



  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getShopkeeperIncomingOrders();
      setOrders(res.data.orders || []);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      setSuccess(''); setError('');
      await updateShopkeeperOrderStatus(id, status);
      setSuccess(`Order marked as ${status}.`);
      fetchOrders(); // refresh order list
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.price || !form.category) {
      setError('Please provide product name, price, and category.');
      return;
    }

    try {
      if (editingProductId) {
        // Update existing product
        await updateShopkeeperProduct(editingProductId, {
          name: form.name,
          category: form.category,
          price: form.price,
          price_unit: form.price_unit,
          stock: form.stock || '0',
          description: form.description,
          discount_price: form.discount_price || null,
          hsn_sac: form.hsn_sac || null,
          gst_rate: form.gst_rate || 0
        });
        setSuccess('Product updated successfully.');
      } else {
        // Add new product
        const data = new FormData();
        data.append('name', form.name);
        data.append('category', form.category);
        data.append('price', form.price);
        data.append('price_unit', form.price_unit);
        data.append('stock', form.stock || '0');
        data.append('description', form.description);
        if (form.hsn_sac) data.append('hsn_sac', form.hsn_sac);
        if (form.gst_rate) data.append('gst_rate', form.gst_rate);
        if (form.discount_price) data.append('discount_price', form.discount_price);
        if (form.image) data.append('image', form.image);

        await addShopkeeperProduct(data);
        setSuccess('Product added successfully!');
      }

      setForm({ name: '', category: '', price: '', price_unit: 'kg', stock: '', description: '', image: null, discount_price: '', hsn_sac: '', gst_rate: '' });
      setEditingProductId(null);
      fetchProducts();
    } catch (e) {
      setError((e.response?.data?.message) || 'Could not add/update product.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setError('');
    setSuccess('');
    try {
      await deleteShopkeeperProduct(id);
      setSuccess('Product deleted.');
      if (editingProductId === id) {
        setEditingProductId(null);
        setForm({ name: '', category: '', price: '', price_unit: 'kg', stock: '', description: '', image: null, discount_price: '', hsn_sac: '', gst_rate: '' });
      }
      fetchProducts();
    } catch (e) {
      setError((e.response?.data?.message) || 'Could not delete product.');
    }
  };

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name || '',
      category: product.category || '',
      price: product.price || '',
      price_unit: product.price_unit || 'kg',
      stock: product.stock ?? '',
      description: product.description || '',
      image: null,
      discount_price: product.discount_price || '',
      hsn_sac: product.hsn_sac || '',
      gst_rate: product.gst_rate || ''
    });
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setForm({ name: '', category: '', price: '', price_unit: 'kg', stock: '', description: '', image: null, discount_price: '', hsn_sac: '', gst_rate: '' });
    setError('');
    setSuccess('');
  };

  const handleUpiSave = async (e) => {
    e.preventDefault();
    setUpiMsg({ type: '', text: '' });
    try {
      const { updateShopkeeperUpi } = require('../services/api');
      await updateShopkeeperUpi(upiForm);
      setUpiMsg({ type: 'success', text: 'UPI Settings updated successfully. Farmers can now scan and pay you directly!' });
    } catch (e) {
      setUpiMsg({ type: 'error', text: e.response?.data?.message || 'Failed to update UPI settings' });
    }
  };

  const handleInvoiceSave = async (e) => {
    e.preventDefault();
    setInvoiceMsg({ type: '', text: '' });
    try {
      const { updateShopkeeperInvoiceSettings } = require('../services/api');
      await updateShopkeeperInvoiceSettings(invoiceForm);
      setInvoiceMsg({ type: 'success', text: 'Invoice settings updated successfully!' });
    } catch (e) {
      setInvoiceMsg({ type: 'error', text: e.response?.data?.message || 'Failed to update invoice settings' });
    }
  };

  return (
    <div className="shopkeeper-page page-enter">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="section-title">🏪 Shopkeeper Portal</h1>
            <p className="section-subtitle">Manage your shop and product listings</p>
          </div>
        </div>

        <div className="shopkeeper-layout">
          <div className="shop-info-card">
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 15px' }}>
              <div className="shop-icon" style={{ position: 'relative', width: '100%', height: '100%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9ecef', borderRadius: '50%', fontSize: '40px', overflow: 'hidden' }}>
                {user?.profile_picture ? (
                  <img src={`http://localhost:5001${user.profile_picture}`} alt="Profile" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '🏪'
                )}
              </div>
              <label htmlFor="profile-upload" style={{ position: 'absolute', bottom: '0', right: '0', cursor: 'pointer', background: '#3498db', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} title="Update Profile Picture">
                📷
              </label>
              <input type="file" id="profile-upload" style={{ display: 'none' }} accept="image/*" onChange={handleProfilePictureUpload} />
            </div>
            <h3>{user?.shop_name || 'My Shop'}</h3>
            <p>{user?.name}</p>
            <div className="shop-meta">
              {user?.city && (
                <div>
                  <span>📍</span>
                  <span>{user.city}</span>
                </div>
              )}
              {user?.district && (
                <div>
                  <span>🗺️</span>
                  <span>{user.district}</span>
                </div>
              )}
              {user?.mobile && (
                <div>
                  <span>📱</span>
                  <span>{user.mobile}</span>
                </div>
              )}
              {user?.email && (
                <div>
                  <span>📧</span>
                  <span>{user.email}</span>
                </div>
              )}
              {user?.gst_number && (
                <div>
                  <span>📋</span>
                  <span>GST: {user.gst_number}</span>
                </div>
              )}
            </div>
          </div>

          <div className="shop-main">
            <div className="tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              <button
                className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('products')}
              >
                Products Management
              </button>
              <button
                className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('orders')}
              >
                Incoming Orders {orders.length > 0 && `(${orders.length})`}
              </button>
              <button
                className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings (UPI & Invoice)
              </button>

            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {activeTab === 'products' ? (
              <>
                <div className="alert alert-info" style={{ marginBottom: 28 }}>
                  ℹ️ Add or manage your products with name, category, price & stock. New products are reviewed by admin before being available to farmers.
                </div>
                <form className="shopkeeper-product-form" onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <label>
                      Product Name *
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Price *
                      <input
                        type="number"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Unit
                      <select value={form.price_unit} onChange={(e) => handleChange('price_unit', e.target.value)}>
                        <option value="kg">kg</option>
                        <option value="g">Gram</option>
                        <option value="l">Liter</option>
                      </select>
                    </label>

                    <label>
                      Discount Price
                      <input
                        type="number"
                        step="0.01"
                        value={form.discount_price}
                        onChange={(e) => handleChange('discount_price', e.target.value)}
                      />
                    </label>

                    <label>
                      Stock
                      <input
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={(e) => handleChange('stock', e.target.value)}
                      />
                    </label>

                    <label>
                      HSN/SAC Code
                      <input
                        type="text"
                        value={form.hsn_sac || ''}
                        onChange={(e) => handleChange('hsn_sac', e.target.value)}
                      />
                    </label>

                    <label>
                      GST Rate (%)
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.gst_rate || ''}
                        onChange={(e) => handleChange('gst_rate', e.target.value)}
                      />
                    </label>

                    <label>
                      Category *
                      <select
                        value={form.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        required
                      >
                        <option value="" disabled>Select a category</option>
                        <option value="seed">Seed</option>
                        <option value="fertilizer">Fertilizer</option>
                        <option value="medicine">Pesticide / Medicine</option>
                      </select>
                    </label>

                    <label>
                      Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleChange('image', e.target.files?.[0] || null)}
                      />
                    </label>

                    <label className="full-width">
                      Description
                      <textarea
                        rows="3"
                        value={form.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">
                      {editingProductId ? 'Update Product' : 'Add Product'}
                    </button>
                    {editingProductId && (
                      <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>

                <div className="shopkeeper-product-list">
                  <h3>Your Products ({products.length})</h3>
                  {loading ? (
                    <p>Loading products...</p>
                  ) : products.length === 0 ? (
                    <p>No products yet. Add one above.</p>
                  ) : (
                    <div className="product-cards">
                      {products.map((p) => (
                        <div key={p.id} className="product-card">
                          <div className="product-head">
                            <div>
                              <strong>{p.name}</strong>
                              <p>{p.category || 'Uncategorized'}</p>
                            </div>
                            <div className="action-group">
                              <button className="btn btn-outline btn-sm" onClick={() => handleEdit(p)}>
                                Edit
                              </button>
                              <button className="btn btn-outline btn-sm" onClick={() => handleDelete(p.id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                          <p>{p.description || 'No description provided.'}</p>
                          <div className="product-meta">
                            <span>💲{p.price} / {p.price_unit || 'unit'}</span>
                            <span>📦 {p.stock ?? 0}</span>
                            <span>🔍 {p.is_approved ? 'Approved' : 'Pending'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : activeTab === 'orders' ? (
              <div className="shopkeeper-orders-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <h2>E-Commerce Orders Management</h2>
                   <button className="btn btn-success" onClick={fetchOrders} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                      <span style={{ fontSize: '1.2em' }}>↻</span> Refresh
                   </button>
                </div>
                {loadingOrders ? (
                  <p>Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p>No incoming orders yet.</p>
                ) : (
                  <div className="table-responsive" style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                      <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eaeaea' }}>
                        <tr>
                          <th style={{ padding: '15px', fontWeight: 'bold', color: '#333' }}>Order ID</th>
                          <th style={{ padding: '15px', fontWeight: 'bold', color: '#333' }}>Customer</th>
                          <th style={{ padding: '15px', fontWeight: 'bold', color: '#333' }}>Amount</th>
                          <th style={{ padding: '15px', fontWeight: 'bold', color: '#333' }}>Date</th>
                          <th style={{ padding: '15px', fontWeight: 'bold', color: '#333' }}>Status</th>
                          <th style={{ padding: '15px', fontWeight: 'bold', color: '#333' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <React.Fragment key={o.id}>
                            <tr style={{ borderBottom: '1px solid #eaeaea', backgroundColor: '#fff' }}>
                              <td style={{ padding: '15px', color: '#555' }}>#{o.id}</td>
                              <td style={{ padding: '15px' }}>
                                <div style={{ fontWeight: 'bold', color: '#333' }}>{o.farmer_name}</div>
                                <div style={{ fontSize: '0.85em', color: '#777' }}>{o.farmer_mobile}</div>
                              </td>
                              <td style={{ padding: '15px', fontWeight: 'bold', color: '#28a745' }}>
                                ₹{Number(o.total_amount).toFixed(2)}
                              </td>
                              <td style={{ padding: '15px', color: '#555' }}>
                                {new Date(o.created_at).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '15px' }}>
                                <select
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                    backgroundColor: o.order_status === 'delivered' ? '#d4edda' : (o.order_status === 'processing' ? '#cce5ff' : '#fff3cd'),
                                    color: '#333',
                                    outline: 'none',
                                    cursor: 'pointer'
                                  }}
                                  value={o.order_status || 'pending'}
                                  onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td style={{ padding: '15px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                  <button
                                    className="btn btn-sm"
                                    style={{ backgroundColor: '#3498db', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                    onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                                  >
                                    {expandedOrderId === o.id ? 'Hide Details' : 'View Details'}
                                  </button>
                                  {o.order_status === 'delivered' && (
                                    <button
                                      className="btn btn-sm"
                                      style={{ backgroundColor: '#343a40', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                      onClick={() => generateInvoice(o)}
                                    >
                                      ⬇ INVOICE
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {expandedOrderId === o.id && (
                              <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #eaeaea' }}>
                                <td colSpan="6" style={{ padding: '20px' }}>
                                  <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '250px' }}>
                                      <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ddd', paddingBottom: '5px', color: '#333' }}>Shipping Information</h4>
                                      <p style={{ margin: '5px 0', fontSize: '0.9em' }}><strong>Email:</strong> {o.farmer_email || 'N/A'}</p>
                                      <p style={{ margin: '5px 0', fontSize: '0.9em' }}><strong>Contact:</strong> {o.farmer_mobile}</p>
                                      <p style={{ margin: '5px 0', fontSize: '0.9em' }}><strong>Address:</strong> {o.delivery_address || o.village || 'N/A'}</p>
                                      {o.note && <p style={{ margin: '5px 0', fontSize: '0.9em', fontStyle: 'italic' }}><strong>Note:</strong> {o.note}</p>}
                                    </div>
                                    <div style={{ flex: 2, minWidth: '300px' }}>
                                      <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ddd', paddingBottom: '5px', color: '#333' }}>Order Items ({o.items ? o.items.length : 0})</h4>
                                      <div style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '4px', padding: '10px' }}>
                                        {o.items && o.items.map((item, idx) => (
                                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < o.items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                              {item.image_url ? (
                                                <img src={item.image_url} alt={item.product_name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                              ) : (
                                                <div style={{ width: '40px', height: '40px', backgroundColor: '#e9ecef', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                                              )}
                                              <div>
                                                <div style={{ fontWeight: 'bold', color: '#333' }}>{item.product_name}</div>
                                                <div style={{ fontSize: '0.85em', color: '#777' }}>₹{item.price_at_purchase} x {item.quantity} {item.price_unit}</div>
                                              </div>
                                            </div>
                                            <div style={{ fontWeight: 'bold', color: '#333' }}>
                                              ₹{item.subtotal}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : activeTab === 'settings' ? (
              <div className="shopkeeper-settings">
                <h3>UPI Payment Settings</h3>
                <div className="alert alert-info" style={{ marginBottom: 20 }}>
                  ⚠️ Keep your UPI ID correct otherwise you will not receive payments from farmers!
                </div>

                {upiMsg.text && (
                  <div className={`alert ${upiMsg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
                    {upiMsg.text}
                  </div>
                )}

                <form className="shopkeeper-product-form" onSubmit={handleUpiSave} style={{ maxWidth: 500 }}>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <label>
                      Your UPI ID (e.g. shopname@upi or mobile@paytm)
                      <input
                        type="text"
                        value={upiForm.upi_id}
                        onChange={(e) => setUpiForm(p => ({ ...p, upi_id: e.target.value }))}
                        placeholder="e.g. 9876543210@ybl"
                      />
                    </label>
                    <label>
                      Display Name for QR Code
                      <input
                        type="text"
                        value={upiForm.upi_name}
                        onChange={(e) => setUpiForm(p => ({ ...p, upi_name: e.target.value }))}
                        placeholder="e.g. Bharat Store"
                      />
                    </label>
                  </div>
                  <div className="form-actions" style={{ marginTop: 20 }}>
                    <button className="btn btn-primary" type="submit">
                      Save UPI Settings
                    </button>
                  </div>
                </form>

                <h3 style={{ marginTop: 40 }}>Invoice Settings</h3>
                <div className="alert alert-info" style={{ marginBottom: 20 }}>
                  📝 These details will be printed on the invoices downloaded by farmers.
                </div>

                {invoiceMsg.text && (
                  <div className={`alert ${invoiceMsg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
                    {invoiceMsg.text}
                  </div>
                )}

                <form className="shopkeeper-product-form" onSubmit={handleInvoiceSave} style={{ maxWidth: 600 }}>
                  <div className="form-grid">
                    <label>
                      GSTIN Number
                      <input
                        type="text"
                        value={invoiceForm.gst_number}
                        onChange={(e) => setInvoiceForm(p => ({ ...p, gst_number: e.target.value }))}
                        placeholder="e.g. 24AA..."
                      />
                    </label>
                    <label>
                      Bank Name
                      <input
                        type="text"
                        value={invoiceForm.bank_name}
                        onChange={(e) => setInvoiceForm(p => ({ ...p, bank_name: e.target.value }))}
                        placeholder="e.g. HDFC Bank Ltd"
                      />
                    </label>
                    <label>
                      Bank Account Number
                      <input
                        type="text"
                        value={invoiceForm.bank_account_number}
                        onChange={(e) => setInvoiceForm(p => ({ ...p, bank_account_number: e.target.value }))}
                      />
                    </label>
                    <label>
                      Bank IFSC Code
                      <input
                        type="text"
                        value={invoiceForm.bank_ifsc}
                        onChange={(e) => setInvoiceForm(p => ({ ...p, bank_ifsc: e.target.value }))}
                      />
                    </label>
                    <label className="full-width">
                      Terms & Conditions (One per line)
                      <textarea
                        rows="4"
                        value={invoiceForm.invoice_terms}
                        onChange={(e) => setInvoiceForm(p => ({ ...p, invoice_terms: e.target.value }))}
                        placeholder="1. Goods once sold will not be taken back.&#10;2. Subject to local jurisdiction only."
                      />
                    </label>
                  </div>
                  <div className="form-actions" style={{ marginTop: 20 }}>
                    <button className="btn btn-primary" type="submit">
                      Save Invoice Settings
                    </button>
                  </div>
                </form>
              </div>

            ) : null}

          </div>
        </div>
      </div>
    </div>
  );
}
