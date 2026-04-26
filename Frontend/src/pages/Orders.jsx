import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders, getOrderById, getMyShopkeeperOrders, deleteOrder, deleteShopkeeperOrder } from '../services/api';
import { generateInvoice } from '../utils/generateInvoice';
import './Orders.css';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    Promise.all([getMyOrders(), getMyShopkeeperOrders()])
      .then(([adminRes, shopRes]) => {
        const adminOrders = (adminRes.data.orders || []).map(o => ({ ...o, order_type: 'official' }));
        const shopOrders = (shopRes.data.orders || []).map(o => ({
          ...o,
          order_type: 'local',
          status: o.order_status,
          item_count: o.items ? o.items.length : 0
        }));

        const combined = [...adminOrders, ...shopOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setOrders(combined);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const viewDetail = async (order) => {
    if (order.order_type === 'local') {
      setSelected(order.id + 'local');
      setDetail({
        order: { ...order },
        items: (order.items || []).map(i => ({
          id: i.id,
          item_name: i.product_name,
          item_type: 'shop product',
          quantity: i.quantity,
          price_at_purchase: i.price_at_purchase
        }))
      });
      return;
    }

    setSelected(order.id + 'official');
    setDetailLoading(true);
    try { const r = await getOrderById(order.id); setDetail(r.data); }
    catch { }
    finally { setDetailLoading(false); }
  };

  const handleCancelOrder = async () => {
    if (!detail || !detail.order) return;
    if (detail.order.status && (detail.order.status.toLowerCase() === 'delivered' || detail.order.status.toLowerCase() === 'cancelled')) {
      alert('Cannot cancel this order.');
      return;
    }
    if (!window.confirm('Are you sure you want to cancel this order? If you paid online, a refund will be issued.')) return;

    setLoading(true);
    try {
      const res = detail.order.order_type === 'local'
        ? await deleteShopkeeperOrder(detail.order.id)
        : await deleteOrder(detail.order.id);

      // Update state locally to immediately mark the order as cancelled
      setOrders(prev => prev.map(o =>
        (o.id === detail.order.id && o.order_type === detail.order.order_type)
          ? { ...o, status: 'cancelled' }
          : o
      ));

      setDetail({
        ...detail,
        order: { ...detail.order, status: 'cancelled' }
      });

      alert(res.data?.message || 'Order cancelled successfully. Refund has been initiated if applicable.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel the order.');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s) => {
    if (!s) return 'badge-gold';
    const l = s.toLowerCase();
    if (l === 'delivered') return 'badge-green';
    if (l === 'cancelled') return 'badge-red';
    if (l === 'shipped') return 'badge-blue';
    if (l === 'confirmed') return 'badge-gold';
    return 'badge-gold';
  };

  const capitalize = (s) => {
    if (!s) return 'Placed';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const getOrderTitle = (o) => {
    if (!o.items || o.items.length === 0) return `Order #${o.id}`;
    const firstItem = o.items[0];
    const firstItemName = firstItem.item_name || firstItem.product_name;
    if (o.items.length === 1) return firstItemName;
    return `${firstItemName} + ${o.items.length - 1} more`;
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="orders-page page-enter">
      <div className="container">
        <div className="page-header">
          <h1 className="section-title">📦 My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-emoji">📦</div>
            <h3>No orders yet</h3>
            <p>Your placed orders will appear here.</p>
          </div>
        ) : (
          <div className="orders-layout">
            <div className="orders-list">
              {orders.map(o => (
                <div
                  key={o.id + o.order_type}
                  className={`order-card ${selected === (o.id + o.order_type) ? 'selected' : ''}`}
                  onClick={() => viewDetail(o)}
                >
                  <div className="order-card-top">
                    <div>
                      <span className="order-id" style={{ display: 'block', marginBottom: '4px', fontSize: '1.1rem', fontWeight: 600 }}>
                        {getOrderTitle(o)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>Order #{o.id}</span>
                        <span className={`badge ${statusColor(o.status)}`} style={{ marginLeft: 10 }}>
                          {capitalize(o.status)}
                        </span>
                        {o.order_type === 'local' && (
                          <span className="badge badge-gold" style={{ marginLeft: 6 }}>from {o.shop_name}</span>
                        )}
                      </div>
                    </div>
                    <span className="order-total" style={{ fontWeight: 'bold' }}>₹{Number(o.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="order-card-bottom">
                    <span>🧺 {o.item_count} item{o.item_count !== 1 ? 's' : ''}</span>
                    <span>{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-detail-panel">
              {!selected && (
                <div className="empty-state" style={{ padding: '60px 20px' }}>
                  <div className="empty-emoji" style={{ fontSize: '2.5rem' }}>👆</div>
                  <p>Select an order to view details</p>
                </div>
              )}
              {selected && detailLoading && (
                <div className="loading-center" style={{ minHeight: 200 }}><div className="spinner" /></div>
              )}
              {selected && !detailLoading && detail && (
                <div className="order-detail">
                  <div className="order-detail-header" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: 0 }}>{getOrderTitle(detail.order)}</h3>
                    <span className={`badge ${statusColor(detail.order?.status)}`}>{capitalize(detail.order?.status)}</span>

                    {capitalize(detail.order?.status) !== 'Delivered' && capitalize(detail.order?.status) !== 'Cancelled' && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginLeft: 'auto', borderColor: '#e74c3c', color: '#e74c3c', padding: '4px 10px', fontSize: '0.85rem' }}
                        onClick={handleCancelOrder}
                      >
                        Cancel Order ❌
                      </button>
                    )}

                    {detail.order?.order_type === 'local' && capitalize(detail.order?.status) === 'Delivered' && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '0.85rem' }}
                        onClick={() => generateInvoice(detail.order)}
                      >
                        Download Invoice 📄
                      </button>
                    )}

                    {detail.order?.order_type === 'local' && capitalize(detail.order?.status) !== 'Cancelled' && (!detail.order?.payment_status || detail.order?.payment_status === 'pending' || detail.order?.payment_status === 'cod_pending') && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginLeft: 10, padding: '4px 10px', fontSize: '0.85rem' }}
                        onClick={() => navigate(`/shopkeeper-payment/${detail.order.id}`)}
                      >
                        Pay via QR 📱
                      </button>
                    )}
                  </div>
                  <div className="order-detail-meta" style={{ marginTop: '15px' }}>
                    <div><span>🏷️ Order ID</span><strong>#{detail.order?.id}</strong></div>
                    <div><span>📅 Date</span><strong>{new Date(detail.order?.created_at).toLocaleDateString('en-IN')}</strong></div>
                    <div><span>💰 Total</span><strong>₹{Number(detail.order?.total_amount).toFixed(2)}</strong></div>
                    {detail.order?.address && <div style={{ gridColumn: '1/-1' }}><span>📍 Address</span><strong>{detail.order.address}</strong></div>}
                    {detail.order?.delivery_address && <div style={{ gridColumn: '1/-1' }}><span>📍 Address</span><strong>{detail.order.delivery_address}</strong></div>}
                    {detail.order?.shop_name && <div style={{ gridColumn: '1/-1', display: 'flex', gap: '8px' }}><span className="badge badge-gold">Local Order</span><strong>{detail.order.shop_name} ({detail.order.shop_mobile})</strong></div>}
                  </div>

                  <h4 style={{ margin: '20px 0 12px', color: 'var(--green-deep)' }}>Items</h4>
                  {(detail.items || []).map(item => (
                    <div key={item.id} className="order-item">
                      <div>
                        <strong>{item.item_name}</strong>
                        <span className="badge badge-green" style={{ marginLeft: 8 }}>{item.item_type}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        {item.quantity} × ₹{item.price_at_purchase} = <strong>₹{(item.quantity * item.price_at_purchase).toFixed(2)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
