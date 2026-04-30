import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getCart, updateCartItem, removeFromCart, removeFromShopCart, placeOrder, placeShopkeeperOrder, createPayment, createShopkeeperPayment, BACKEND_URL } from '../services/api';
import './Cart.css';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const fetchCart = () => {
    setLoading(true);
    getCart().then(r => setCart(r.data)).catch(() => setCart(null)).finally(() => setLoading(false));
  };
  useEffect(fetchCart, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const updateQty = async (id, qty, isShop) => {
    if (qty < 1) return;
    try {
      await updateCartItem(id, qty, isShop ? 'shopkeeper' : 'admin');
      fetchCart();
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to update item.'); }
  };

  const removeItem = async (id, isShop) => {
    try {
      if (isShop) await removeFromShopCart(id);
      else await removeFromCart(id);
      fetchCart();
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to remove item.'); }
  };

  const handleItemClick = (item, isShop) => {
    if (isShop) {
      navigate(`/shop/shopkeeper-products/${item.product_id}`);
    } else {
      if (item.product_id) {
        navigate(`/shop/products/${item.product_id}`);
      } else if (item.seed_stock_id && item.crop_id) {
        navigate(`/crops/${item.crop_id}`);
      }
    }
  };

  const handlePaymentForOrder = async (orderId, shopkeeper = false) => {
    if (!paymentMethod) return;

    const paymentData = new FormData();
    paymentData.append('order_id', orderId);
    paymentData.append('payment_method', paymentMethod);

    if (shopkeeper) {
      await createShopkeeperPayment(paymentData);
    } else {
      paymentData.append('delivery_address', address);
      await createPayment(paymentData);
    }
  };

  const handleOrder = async () => {
    if (!address.trim()) { showMsg('Please enter a delivery address.'); return; }


    setPlacing(true);
    try {
      const adminItems = cart?.admin_cart?.items || [];
      const shopItems = cart?.shopkeeper_cart?.items || [];
      const createdOrderIds = [];

      if (adminItems.length > 0) {
        const res = await placeOrder({ address });
        if (res?.data?.order_id) {
          createdOrderIds.push({ id: res.data.order_id, shopkeeper: false });
          await handlePaymentForOrder(res.data.order_id, false);
        }
      }

      if (shopItems.length > 0) {
        const grouped = shopItems.reduce((acc, item) => {
          const key = item.shopkeeper_id;
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        }, {});

        for (const shopkeeperId of Object.keys(grouped)) {
          const res = await placeShopkeeperOrder({ shopkeeper_id: shopkeeperId, address, note: '' });
          if (res?.data?.order_id) {
            const orderInfo = res.data.order_id;
            createdOrderIds.push({ id: orderInfo, shopkeeper: true });
            await handlePaymentForOrder(orderInfo, true);
          }
        }
      }

      if (createdOrderIds.length === 0) {
        throw new Error('Cart is empty or order not created.');
      }

      showMsg('Order placed successfully! 🎉');
      setTimeout(() => navigate('/orders'), 2000);

    } catch (err) {
      showMsg(err.response?.data?.message || err.message || 'Order failed.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const adminItems = cart?.admin_cart?.items || [];
  const shopItems = cart?.shopkeeper_cart?.items || [];
  const total = cart?.grand_total || 0;
  const isEmpty = adminItems.length === 0 && shopItems.length === 0;

  const getShopkeeperGroups = () => {
    const groups = {};
    shopItems.forEach(item => {
      if (!groups[item.shopkeeper_id]) {
        groups[item.shopkeeper_id] = {
          id: item.shopkeeper_id,
          name: item.shop_name,
          upi_id: item.upi_id,
          upi_name: item.upi_name,
          total: 0
        };
      }
      groups[item.shopkeeper_id].total += (item.price_snapshot * item.quantity);
    });
    return Object.values(groups);
  };

  return (
    <div className="cart-page page-enter">
      <div className="container">
        <div className="page-header">
          <h1 className="section-title">🛒 My Cart</h1>
        </div>

        {msg && <div className="alert alert-success">{msg}</div>}

        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-emoji">🛍️</div>
            <h3>Your cart is empty</h3>
            <p>Browse the shop to add seeds, fertilizers, and medicines.</p>
            <Link to="/shop" className="btn btn-primary" style={{ marginTop: 20 }}>Go to Shop →</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {/* Admin Cart Items */}
              {adminItems.length > 0 && (
                <div className="cart-section">
                  <h3 className="cart-section-title">🏬 Admin Store</h3>
                  {adminItems.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-img">
                        {item.product_image
                          ? <img src={`${BACKEND_URL}${item.product_image.startsWith('/') ? '' : '/'}${item.product_image}`} alt="" />
                          : <span>{item.item_type === 'seed' ? '🌱' : '📦'}</span>
                        }
                      </div>
                      <div className="cart-item-info" onClick={() => handleItemClick(item, false)} style={{ cursor: 'pointer' }}>
                        <strong>{item.product_name || item.seed_name || 'Item'}</strong>
                        {item.crop_name && <span className="badge badge-green" style={{ marginLeft: 8 }}>{item.crop_name}</span>}
                        <div className="cart-item-price">₹{item.price_snapshot} / {item.price_unit || 'unit'}</div>
                      </div>
                      <div className="cart-item-qty">
                        <button onClick={() => updateQty(item.id, item.quantity - 1, false)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1, false)}>+</button>
                      </div>
                      <div className="cart-item-subtotal">₹{(item.price_snapshot * item.quantity).toFixed(2)}</div>
                      <button className="remove-item-btn" onClick={() => removeItem(item.id, false)}>🗑</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Shopkeeper Cart Items */}
              {shopItems.length > 0 && (
                <div className="cart-section">
                  <h3 className="cart-section-title">🏪 Shopkeeper Products</h3>
                  {shopItems.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-img">
                        {item.image_url
                          ? <img src={`${BACKEND_URL}${item.image_url.startsWith('/') ? '' : '/'}${item.image_url}`} alt="" />
                          : <span>📦</span>
                        }
                      </div>
                      <div className="cart-item-info" onClick={() => handleItemClick(item, true)} style={{ cursor: 'pointer' }}>
                        <strong>{item.product_name || 'Item'}</strong>
                        {item.shop_name && <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>🏪 {item.shop_name} · {item.city}</div>}
                        <div className="cart-item-price">₹{item.price_snapshot} / unit</div>
                      </div>
                      <div className="cart-item-qty">
                        <button onClick={() => updateQty(item.id, item.quantity - 1, true)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1, true)}>+</button>
                      </div>
                      <div className="cart-item-subtotal">₹{(item.price_snapshot * item.quantity).toFixed(2)}</div>
                      <button className="remove-item-btn" onClick={() => removeItem(item.id, true)}>🗑</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row"><span>Admin Store</span><span>₹{cart?.admin_cart?.total?.toFixed(2) || '0.00'}</span></div>
              <div className="summary-row"><span>Shopkeeper</span><span>₹{cart?.shopkeeper_cart?.total?.toFixed(2) || '0.00'}</span></div>
              <div className="summary-divider" />
              <div className="summary-total"><span>Grand Total</span><strong>₹{total.toFixed(2)}</strong></div>

              <div className="form-group" style={{ marginTop: 8 }}>
                <label>📍 Delivery Address *</label>
                <textarea
                  rows={3} placeholder="Enter your delivery address..."
                  value={address} onChange={e => setAddress(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginTop: 24 }}>
                <label>💳 Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cod">Cash on Delivery</option>
                  <option value="upi">UPI (Online)</option>
                </select>
              </div>

              {paymentMethod === 'upi' && (
                <>
                  {!address.trim() ? (
                    <div className="alert alert-warning" style={{ marginBottom: 15 }}>
                      Please fill your delivery address above before making payment.
                    </div>
                  ) : (
                    <>
                      {/* Shopkeeper Dynamic QR Codes */}
                      {getShopkeeperGroups().map(shop => shop.upi_id ? (
                        <div key={shop.id} style={{ marginBottom: 20, textAlign: 'center', background: '#fff', padding: '15px', borderRadius: '10px', border: '1px solid #e0e0e0' }}>
                          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Pay to {shop.name}</p>
                          <QRCodeSVG
                            value={`upi://pay?pa=${shop.upi_id}&pn=${encodeURIComponent(shop.upi_name || shop.name)}&am=${shop.total}&cu=INR`}
                            size={150}
                            level="H"
                          />
                          <p style={{ margin: '10px 0 0 0', color: '#2e7d32', fontWeight: 'bold' }}>Amount: ₹{shop.total.toFixed(2)}</p>
                          <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#666' }}>UPI ID: {shop.upi_id}</p>
                        </div>
                      ) : (
                        <div key={shop.id} className="alert alert-info" style={{ marginBottom: 15, fontSize: '0.85rem' }}>
                          Shop: <strong>{shop.name}</strong> doesn't have UPI setup yet. The transaction will be saved, but please pay offline or select COD.
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleOrder} disabled={placing || (paymentMethod === 'upi' && !address.trim())}>
                {placing ? '...' : (paymentMethod === 'upi' ? '✅ Done Payment & Place Order' : '✅ Place Order →')}
              </button>
              <Link to="/shop" className="continue-shopping">← Continue Shopping</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
