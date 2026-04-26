import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getShopkeeperQr, confirmShopkeeperPayment } from '../services/api';
import './Cart.css'; // Reuse existing styles for consistency, or add inline styles

export default function ShopkeeperPaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);

  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchQrData();
  }, [orderId]);

  const fetchQrData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getShopkeeperQr(orderId);
      setOrderInfo(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load QR code. Ensure the shopkeeper has a UPI ID setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.length < 12) {
      setError('Please enter a valid 12-digit UTR/Transaction ID.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('order_id', orderId);
      formData.append('utr_number', utrNumber);
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      await confirmShopkeeperPayment(formData);
      setSuccessMsg('Payment confirmed! Your order is now processing.');
      setTimeout(() => {
        navigate('/orders');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm payment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="cart-page page-enter">
      <div className="container">
        <div className="page-header" style={{ textAlign: 'center' }}>
          <h1 className="section-title">📱 Scan & Pay</h1>
          <p className="section-subtitle">Pay directly to the shopkeeper using any UPI App</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {!orderInfo && !loading && !error && (
          <div className="alert alert-error">Order not found or invalid format. <button className="btn btn-outline" onClick={() => navigate('/orders')}>Go Back</button></div>
        )}

        {orderInfo && !successMsg && (
          <div className="cart-layout" style={{ gap: '40px' }}>
            {/* LEFT SIDE: QR CODE */}
            <div className="cart-items" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', borderRadius: '15px', padding: '40px 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '2px solid var(--green-light)' }}>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>{orderInfo.shop_name}</h3>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>UPI ID: {orderInfo.shopkeeper_upi}</span>
              </div>

              <div style={{ padding: '15px', background: 'white', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <QRCodeSVG
                  value={orderInfo.qr_data}
                  size={240}
                  level="H"
                  style={{ display: 'block' }}
                />
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <div style={{ color: '#2e7d32', fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2' }}>
                  ₹{Number(orderInfo.amount).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                  Order #{orderInfo.order_id}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                {/* Simulated payment app icons (as emojis for now due to lack of assets) */}
                <div style={{ fontSize: '2rem' }}>💳</div>
                <div style={{ fontSize: '2rem' }}>📱</div>
                <div style={{ fontSize: '2rem' }}>🏦</div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px', backgroundColor: '#e8f5e9', padding: '15px', borderRadius: '8px', width: '100%' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>આ QR કોડ સ્કેન કરો અને ₹{orderInfo.amount} ચૂકવો</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#555' }}>Scan this QR code and pay ₹{orderInfo.amount}</p>
              </div>
            </div>

            {/* RIGHT SIDE: CONFIRMATION FORM */}
            <div className="cart-summary" style={{ alignSelf: 'flex-start' }}>
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>Payment Confirm કરો</h3>

              <div style={{ display: 'grid', gap: '10px', marginBottom: '25px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Order ID:</span>
                  <strong>#{orderInfo.order_id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Shop Name:</span>
                  <strong>{orderInfo.shop_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Amount To Pay:</span>
                  <strong style={{ color: '#2e7d32' }}>₹{Number(orderInfo.amount).toFixed(2)}</strong>
                </div>
              </div>

              <form onSubmit={handleConfirm}>
                <div className="form-group">
                  <label>UTR / Transaction ID *</label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter 12 digit UTR from GPay/PhonePe"
                    style={{ letterSpacing: '2px' }}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label>Payment Screenshot (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="alert alert-info" style={{ marginTop: '20px', fontSize: '0.85rem' }}>
                  Payment will be verified by admin. Submitting a wrong UTR may lead to order cancellation.
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '20px', fontSize: '1.1rem', padding: '12px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Verifying...' : '✅ Payment Confirm કરો'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
