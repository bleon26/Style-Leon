import React from 'react';
import { getImageUrl } from '../api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

const ProductCard = ({ product, onQuickView }) => {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { showToast } = useToast();

    const renderStars = (rating) => {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        let stars = '★'.repeat(full);
        if (half) stars += '½';
        return stars;
    };

    const handleAddToCart = () => {
        addToCart(product);
        showToast(`"${product.name}" agregado al carrito`, 'success');
    };

    const handleToggleWishlist = () => {
        toggleWishlist(product);
        showToast(
            isInWishlist(product._id)
                ? `"${product.name}" eliminado de favoritos`
                : `"${product.name}" guardado en favoritos`,
            'info'
        );
    };

    // Auto-calculate discount percentage
    const discount = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : product.discount || 0;

    return (
        <div className="product-card" data-id={product._id}>
            <div
                className="product-img-wrap"
                onClick={() => onQuickView && onQuickView(product)}
                style={{ cursor: 'pointer' }}
            >
                <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="product-img"
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400'><rect fill='%23f0f0f0' width='300' height='400'/></svg>";
                    }}
                />
                <div className="product-badges">
                    {discount > 0 && <span className="badge-tag badge-sale">-{discount}%</span>}
                    {product.isSale && <span className="badge-tag badge-sale" style={{ background: 'linear-gradient(135deg, #ff6b6b, #e03131)' }}>🔥 Oferta</span>}
                    {product.isNewProduct && <span className="badge-tag badge-new">Nuevo</span>}
                    {product.reviewsCount > 400 && <span className="badge-tag badge-hot">🔥 Top</span>}
                </div>
                <div className="product-actions-hover">
                    <button
                        className="btn-quick-view"
                        onClick={(e) => {
                            e.stopPropagation();
                            onQuickView && onQuickView(product);
                        }}
                    >
                        👁 Vista Rápida
                    </button>
                    <button
                        className={`btn-heart ${isInWishlist(product._id) ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist();
                        }}
                        aria-label="Favoritos"
                    >
                        ♥
                    </button>
                </div>
            </div>

            <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-rating">
                    <span className="stars">{renderStars(product.rating || 0)}</span>
                    <span>{product.rating} ({product.reviewsCount})</span>
                </div>
                <div className="product-price-row">
                    <span className="product-price">${product.price}</span>
                    {product.originalPrice && <span className="product-original">${product.originalPrice}</span>}
                    {discount > 0 && <span className="product-discount">-{discount}%</span>}
                </div>
                <button
                    className="btn-add-to-cart"
                    onClick={handleAddToCart}
                >
                    Agregar al Carrito
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
