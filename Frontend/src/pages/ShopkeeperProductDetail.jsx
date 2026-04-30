import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getShopkeeperProductById, getShopkeeperProductReviews, addShopkeeperProductReview, addToShopCart, BACKEND_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ProductDetail.css';

export default function ShopkeeperProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, review_text: '' });
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    Promise.all([
      getShopkeeperProductById(id),
      getShopkeeperProductReviews(id)
    ]).then(([pRes, rRes]) => {
      setProduct(pRes.data.product);
      setReviews(rRes.data.reviews || []);
    }).catch(() => {
      setProduct(null);
      setReviews([]);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) return;
    try {
      await addToShopCart({ product_id: product.id, shopkeeper_id: product.shopkeeper_id, quantity: 1 });
      setCartMsg('Added to cart!');
      setTimeout(() => setCartMsg(''), 3000);
    } catch (e) {
      setCartMsg('Failed to add to cart.');
      setTimeout(() => setCartMsg(''), 3000);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return;
    setReviewLoading(true);
    try {
      await addShopkeeperProductReview(id, newReview);
      // Refresh reviews
      const rRes = await getShopkeeperProductReviews(id);
      setReviews(rRes.data.reviews || []);
      setNewReview({ rating: 5, review_text: '' });
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add review.');
    } finally {
      setReviewLoading(false);
    }
  };

  const averageRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!product) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}><h2>Product not found</h2></div>;

  return (
    <div className="product-detail page-enter">
      <div className="container">
        {/* Back */}
        <Link to="/shop" className="back-link">← Back to Shop</Link>

        {/* Product Info */}
        <div className="product-detail-hero">
          <div className="product-image">
            {product.image_url
              ? <img src={`${BACKEND_URL}${product.image_url.startsWith('/') ? '' : '/'}${product.image_url.replace(/\\/g, '/')}`} alt={product.name} />
              : <div className="placeholder-image">{product.category?.toLowerCase() === 'seed' ? '🌱' : product.category?.toLowerCase() === 'fertilizer' ? '🧪' : product.category?.toLowerCase() === 'pesticide' ? '💊' : '🏪'}</div>
            }
          </div>
          <div className="product-info">
            <h1>{product.name}</h1>
            <div className="product-meta">
              <span className="badge badge-gold">{product.shop_name}</span>
              <span className="product-category">{product.category}</span>
              <span className="badge badge-green">{product.city}</span>
            </div>
            {product.description && <p className="product-description">{product.description}</p>}
            <div className="product-price">
              ₹{product.price} <small>per {product.price_unit || 'unit'}</small>
            </div>
            <div className="product-rating">
              ⭐ {averageRating} ({reviews.length} reviews)
            </div>
            {user && (
              <button className="btn-primary" onClick={handleAddToCart} disabled={!!cartMsg}>
                {cartMsg || 'Add to Cart'}
              </button>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h2>Customer Reviews</h2>

          {/* Add Review */}
          {user && (
            <div className="add-review">
              <h3>Write a Review</h3>
              <form onSubmit={handleSubmitReview}>
                <div className="rating-input">
                  <label>Rating:</label>
                  <select value={newReview.rating} onChange={e => setNewReview({...newReview, rating: parseInt(e.target.value)})}>
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{'⭐'.repeat(r)} ({r})</option>)}
                  </select>
                </div>
                <textarea
                  placeholder="Share your experience with this product..."
                  value={newReview.review_text}
                  onChange={e => setNewReview({...newReview, review_text: e.target.value})}
                  required
                />
                <button type="submit" className="btn-secondary" disabled={reviewLoading}>
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <strong>{review.user_name}</strong>
                    <span className="review-rating">{'⭐'.repeat(review.rating)}</span>
                    <small>{new Date(review.created_at).toLocaleDateString()}</small>
                  </div>
                  <p>{review.review_text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
