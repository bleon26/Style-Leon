import React from 'react';
import { getImageUrl } from '../api';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const WishlistDrawer = () => {
    const { wishlist, isOpen, setIsOpen, toggleWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { showToast } = useToast();

    if (!isOpen) return null;

    const handleMoveToCart = (item) => {
        addToCart(item);
        toggleWishlist(item);
        showToast(`"${item.name}" movido al carrito`, 'success');
    };

    const handleRemoveFromWishlist = (item) => {
        toggleWishlist(item);
        showToast(`"${item.name}" eliminado de favoritos`, 'info');
    };

    return (
        <>
            <div className={`wishlist-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}></div>
            <aside className={`wishlist-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="wishlist-header">
                    <h3>Lista de Deseos ({wishlist.length})</h3>
                    <button className="close-wishlist" onClick={() => setIsOpen(false)}>×</button>
                </div>

                <div className="wishlist-body">
                    {wishlist.length === 0 ? (
                        <div className="wishlist-empty-state">
                            <span>❤️</span>
                            <p>Tu lista está vacía</p>
                            <small>Guarda tus artículos favoritos aquí</small>
                        </div>
                    ) : (
                        wishlist.map(item => (
                            <div key={item._id} className="wishlist-item">
                                <img
                                    src={getImageUrl(item.image)}
                                    alt={item.name}
                                    className="wishlist-item-img"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='100'><rect fill='%23f0f0f0' width='80' height='100'/></svg>";
                                    }}
                                />
                                <div className="wishlist-item-info">
                                    <h4 className="wishlist-item-name">{item.name}</h4>
                                    <div className="wishlist-item-cat">{item.category}</div>
                                    <div className="wishlist-item-price">${item.price}</div>
                                </div>
                                <div className="wishlist-item-actions">
                                    <button
                                        className="btn-wish-cart"
                                        onClick={() => handleMoveToCart(item)}
                                    >
                                        Mover al Carrito
                                    </button>
                                    <button
                                        className="btn-wish-remove"
                                        onClick={() => handleRemoveFromWishlist(item)}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>
        </>
    );
};

export default WishlistDrawer;
