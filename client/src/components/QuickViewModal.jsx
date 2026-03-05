import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getImageUrl } from '../api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

const QuickViewModal = ({ product, isOpen, onClose }) => {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { showToast } = useToast();
    const [qty, setQty] = useState(1);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [fadeClass, setFadeClass] = useState('fade-in');
    const intervalRef = useRef(null);

    const images = product && product.images && product.images.length > 0 ? product.images : (product ? [product.image] : []);

    useEffect(() => {
        if (product) {
            setActiveIndex(0);
            setSelectedColor(product.colors?.[0] || null);
            setSelectedSize(product.sizes?.[0] || null);
            setQty(1);
            setFadeClass('fade-in');
        }
    }, [product]);

    // Auto-carousel
    const startAutoPlay = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (images.length <= 1) return;
        intervalRef.current = setInterval(() => {
            setFadeClass('fade-out');
            setTimeout(() => {
                setActiveIndex(prev => (prev + 1) % images.length);
                setFadeClass('fade-in');
            }, 250);
        }, 4000);
    }, [images.length]);

    useEffect(() => {
        if (isOpen && !isHovering) {
            startAutoPlay();
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isOpen, isHovering, startAutoPlay]);

    if (!isOpen || !product) return null;

    const formatImageUrl = (url) => {
        if (!url) return '';
        return getImageUrl(url);
    };

    const renderStars = (rating) => {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        let stars = '★'.repeat(full);
        if (half) stars += '½';
        return stars;
    };

    const goToImage = (index) => {
        if (index === activeIndex) return;
        setFadeClass('fade-out');
        setTimeout(() => {
            setActiveIndex(index);
            setFadeClass('fade-in');
        }, 200);
    };

    const goNext = (e) => {
        e.stopPropagation();
        goToImage((activeIndex + 1) % images.length);
    };

    const goPrev = (e) => {
        e.stopPropagation();
        goToImage((activeIndex - 1 + images.length) % images.length);
    };

    const handleAddToCart = () => {
        addToCart(product, qty, selectedColor, selectedSize);
        showToast(`"${product.name}" x${qty} agregado al carrito`, 'success');
        onClose();
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

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="product-modal" onClick={(e) => e.stopPropagation()} style={{
                maxHeight: '95vh',
                overflowY: 'auto',
                borderRadius: '16px',
                scrollbarWidth: 'thin'
            }}>
                <button className="modal-close" onClick={onClose} style={{
                    position: 'sticky',
                    top: '10px',
                    float: 'right',
                    zIndex: 10,
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    border: '1px solid #eee',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>×</button>
                <div className="modal-inner">
                    <div className="modal-img-wrap">
                        {/* Main Image with Carousel */}
                        <div
                            className="main-img-display"
                            style={{
                                position: 'relative',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: '#f5f5f5'
                            }}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                        >
                            <img
                                src={formatImageUrl(images[activeIndex])}
                                alt={product.name}
                                style={{
                                    width: '100%',
                                    height: '500px',
                                    objectFit: 'cover',
                                    display: 'block',
                                    transition: 'opacity 0.3s ease',
                                    opacity: fadeClass === 'fade-in' ? 1 : 0.3
                                }}
                            />

                            {/* Badges */}
                            <div className="modal-badges" style={{
                                position: 'absolute',
                                top: '12px',
                                left: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                            }}>
                                {(product.originalPrice && product.originalPrice > product.price) && <span className="badge-tag badge-sale" style={{
                                    background: 'linear-gradient(135deg, #ef4444, #ff6b6b)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: '700'
                                }}>-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%</span>}
                                {product.isSale && <span className="badge-tag badge-sale" style={{
                                    background: 'linear-gradient(135deg, #ff6b6b, #e03131)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: '700'
                                }}>🔥 Oferta</span>}
                                {product.isNewProduct && <span className="badge-tag badge-new" style={{
                                    background: 'linear-gradient(135deg, #10b981, #34d399)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: '700'
                                }}>Nuevo</span>}
                            </div>

                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={goPrev}
                                        style={{
                                            position: 'absolute',
                                            left: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.9)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(0,0,0,0.08)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            color: '#333',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                                            transition: 'all 0.2s',
                                            opacity: isHovering ? 1 : 0,
                                            minWidth: 'auto',
                                            minHeight: 'auto'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%)'}
                                    >
                                        ‹
                                    </button>
                                    <button
                                        onClick={goNext}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.9)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(0,0,0,0.08)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            color: '#333',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                                            transition: 'all 0.2s',
                                            opacity: isHovering ? 1 : 0,
                                            minWidth: 'auto',
                                            minHeight: 'auto'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%)'}
                                    >
                                        ›
                                    </button>
                                </>
                            )}

                            {/* Dot Indicators */}
                            {images.length > 1 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '12px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    gap: '8px',
                                    padding: '6px 12px',
                                    background: 'rgba(0,0,0,0.35)',
                                    borderRadius: '20px',
                                    backdropFilter: 'blur(8px)'
                                }}>
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); goToImage(idx); }}
                                            style={{
                                                width: activeIndex === idx ? '20px' : '8px',
                                                height: '8px',
                                                borderRadius: '10px',
                                                background: activeIndex === idx ? 'white' : 'rgba(255,255,255,0.5)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                padding: 0,
                                                minWidth: 'auto',
                                                minHeight: 'auto'
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Image Counter */}
                            {images.length > 1 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: 'rgba(0,0,0,0.5)',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    backdropFilter: 'blur(8px)'
                                }}>
                                    {activeIndex + 1} / {images.length}
                                </div>
                            )}
                        </div>

                        {/* Thumbnails Grid */}
                        {images.length > 1 && (
                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                marginTop: '16px',
                                padding: '4px',
                                overflowX: 'auto',
                                scrollbarWidth: 'thin'
                            }}>
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => goToImage(idx)}
                                        style={{
                                            width: '70px',
                                            height: '100px',
                                            minWidth: '70px',
                                            cursor: 'pointer',
                                            border: activeIndex === idx ? '3px solid var(--primary)' : '2px solid #e0e0e0',
                                            borderRadius: '10px',
                                            overflow: 'hidden',
                                            transition: 'all 0.25s ease',
                                            boxShadow: activeIndex === idx ? '0 4px 12px rgba(233, 30, 140, 0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                                            opacity: activeIndex === idx ? 1 : 0.7,
                                            background: '#f0f0f0',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.opacity = '1';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            if (activeIndex !== idx) e.currentTarget.style.opacity = '0.7';
                                        }}
                                    >
                                        <img
                                            src={formatImageUrl(img)}
                                            alt={`Vista ${idx + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                display: 'block'
                                            }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect fill='%23f0f0f0' width='80' height='80'/><text x='50%25' y='50%25' font-size='20' text-anchor='middle' dy='.3em' fill='%23ccc'>📷</text></svg>";
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="modal-info">
                        <span className="modal-category" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', color: '#888' }}>{product.category}</span>
                        <h2 className="modal-title" style={{ marginTop: '5px', marginBottom: '15px' }}>{product.name}</h2>
                        <div className="modal-rating" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <span className="stars" style={{ color: '#ffd700', fontSize: '1.2rem' }}>{renderStars(product.rating || 0)}</span>
                            <span style={{ fontSize: '0.9rem', color: '#666' }}>{product.rating} ({product.reviewsCount} reseñas)</span>
                        </div>
                        <div className="modal-price-wrap" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <span className="modal-price" style={{ fontSize: '1.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>${product.price}</span>
                            {product.originalPrice && <span className="modal-original-price" style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '1.2rem' }}>${product.originalPrice}</span>}
                            {(product.originalPrice && product.originalPrice > product.price) && (
                                <span style={{
                                    background: 'linear-gradient(135deg, #ef4444, #ff6b6b)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: '700'
                                }}>-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%</span>
                            )}
                        </div>
                        <p className="modal-desc" style={{ lineHeight: '1.6', color: '#555', marginBottom: '25px' }}>{product.description || 'Este producto de alta calidad ha sido seleccionado especialmente para ti. Combina estilo y comodidad en una sola pieza.'}</p>

                        {product.colors && product.colors.length > 0 && (
                            <div className="option-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px' }}>COLOR:</label>
                                <div className="color-swatches" style={{ display: 'flex', gap: '10px' }}>
                                    {product.colors.map(color => (
                                        <button
                                            key={color}
                                            className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                                            title={color}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: color.toLowerCase(),
                                                border: selectedColor === color ? '2px solid white' : '1px solid #eee',
                                                boxShadow: selectedColor === color ? '0 0 0 2px var(--primary)' : 'none',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setSelectedColor(color)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {product.sizes && product.sizes.length > 0 && (
                            <div className="option-group" style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px' }}>TALLA:</label>
                                <div className="size-swatches" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {product.sizes.map(size => (
                                        <button
                                            key={size}
                                            className={`size-swatch ${selectedSize === size ? 'selected' : ''}`}
                                            style={{
                                                padding: '8px 15px',
                                                border: selectedSize === size ? '1px solid var(--primary)' : '1px solid #ddd',
                                                backgroundColor: selectedSize === size ? 'var(--primary)' : 'white',
                                                color: selectedSize === size ? 'white' : '#333',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => setSelectedSize(size)}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                            <div className="qty-control" style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', flexShrink: 0 }}>
                                <button className="qty-btn" style={{ padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: '600' }} onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                                <span style={{ padding: '0 12px', fontWeight: 'bold', fontSize: '1rem', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                                <button className="qty-btn" style={{ padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: '600' }} onClick={() => setQty(qty + 1)}>+</button>
                            </div>
                            <button
                                className="btn-primary"
                                style={{ flex: 1, minWidth: '180px', padding: '14px 20px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}
                                onClick={handleAddToCart}
                            >
                                🛒 Agregar al Carrito
                            </button>
                            <button
                                className={`btn-wishlist ${isInWishlist(product._id) ? 'active' : ''}`}
                                style={{
                                    width: '45px',
                                    height: '45px',
                                    minWidth: '45px',
                                    borderRadius: '50%',
                                    border: '1px solid #eee',
                                    background: isInWishlist(product._id) ? '#fff0f3' : 'white',
                                    color: isInWishlist(product._id) ? '#ff4d6d' : '#888',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                                onClick={handleToggleWishlist}
                            >
                                {isInWishlist(product._id) ? '♥' : '♡'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default QuickViewModal;
