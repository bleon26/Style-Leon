import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CartDrawer = () => {
    const {
        cart,
        isOpen,
        setIsOpen,
        removeFromCart,
        updateQty,
        cartTotal,
        clearCart
    } = useCart();
    const { user, setIsOpen: setIsAuthOpen } = useAuth();
    const { showToast } = useToast();

    // Checkout form state
    const [showCheckoutForm, setShowCheckoutForm] = useState(false);
    const [towns, setTowns] = useState([]);
    const [checkoutData, setCheckoutData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerTown: '',
        customerAddress: '',
        customerReference: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load towns when checkout form opens
    useEffect(() => {
        if (showCheckoutForm) {
            api.get('/towns').then(res => setTowns(res.data)).catch(() => { });
            // Pre-fill with user data if available
            if (user) {
                setCheckoutData(prev => ({
                    ...prev,
                    customerName: prev.customerName || user.name || '',
                    customerEmail: prev.customerEmail || user.email || ''
                }));
            }
        }
    }, [showCheckoutForm, user]);

    if (!isOpen) return null;

    const handleStartCheckout = () => {
        if (!user) {
            showToast('Por favor inicia sesión para continuar', 'info');
            setIsAuthOpen(true);
            setIsOpen(false);
            return;
        }
        setShowCheckoutForm(true);
    };

    const handleBackToCart = () => {
        setShowCheckoutForm(false);
    };

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        if (!checkoutData.customerName.trim() || !checkoutData.customerPhone.trim() || !checkoutData.customerTown || !checkoutData.customerAddress.trim()) {
            showToast('Por favor llena todos los campos requeridos', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/orders', {
                items: cart,
                totalPrice: cartTotal > 299 ? cartTotal : cartTotal + 99,
                shippingAddress: {
                    address: checkoutData.customerTown,
                    city: checkoutData.customerTown,
                    state: 'Puebla',
                    zip: '00000'
                },
                customerName: checkoutData.customerName,
                customerEmail: checkoutData.customerEmail,
                customerPhone: checkoutData.customerPhone,
                customerTown: checkoutData.customerTown,
                customerAddress: checkoutData.customerAddress,
                customerReference: checkoutData.customerReference
            });
            showToast('¡Gracias por tu compra! Procesando pedido...', 'success');
            clearCart();
            setShowCheckoutForm(false);
            setCheckoutData({ customerName: '', customerEmail: '', customerPhone: '', customerTown: '', customerAddress: '', customerReference: '' });
            setIsOpen(false);
        } catch (err) {
            showToast('Error al procesar el pedido: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setShowCheckoutForm(false);
        setIsOpen(false);
    };

    const totalWithShipping = cartTotal > 299 ? cartTotal : cartTotal + 99;

    // --- CHECKOUT FORM VIEW ---
    if (showCheckoutForm) {
        return (
            <>
                <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={handleClose}></div>
                <aside className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
                    <div className="cart-header">
                        <h3>📋 Información de Envío</h3>
                        <button className="close-cart" onClick={handleClose}>×</button>
                    </div>

                    <div className="cart-items" style={{ padding: '20px', overflowY: 'auto' }}>
                        {/* Order Summary */}
                        <div style={{
                            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                            borderRadius: '12px',
                            padding: '15px',
                            marginBottom: '20px',
                            border: '1px solid #e9ecef'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>Resumen del pedido</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem' }}>{cart.length} producto{cart.length > 1 ? 's' : ''}</span>
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>${totalWithShipping.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCheckoutSubmit} id="checkout-form">
                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#333' }}>
                                    Nombre completo *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Juan Pérez López"
                                    value={checkoutData.customerName}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, customerName: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #ddd',
                                        fontSize: '0.95rem',
                                        transition: 'border-color 0.2s',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#e91e8c'}
                                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                />
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#333' }}>
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={checkoutData.customerEmail}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, customerEmail: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #ddd',
                                        fontSize: '0.95rem',
                                        transition: 'border-color 0.2s',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#e91e8c'}
                                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                />
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#333' }}>
                                    📱 Teléfono / WhatsApp *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="Ej: 776 123 4567"
                                    value={checkoutData.customerPhone}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, customerPhone: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #ddd',
                                        fontSize: '0.95rem',
                                        transition: 'border-color 0.2s',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#e91e8c'}
                                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                />
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#333' }}>
                                    📍 Pueblo / Localidad *
                                </label>
                                <select
                                    required
                                    value={checkoutData.customerTown}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, customerTown: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #ddd',
                                        fontSize: '0.95rem',
                                        transition: 'border-color 0.2s',
                                        outline: 'none',
                                        background: 'white',
                                        color: checkoutData.customerTown ? '#333' : '#999',
                                        boxSizing: 'border-box',
                                        cursor: 'pointer'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#e91e8c'}
                                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                >
                                    <option value="" disabled>Selecciona tu pueblo...</option>
                                    {towns.map(t => (
                                        <option key={t._id} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#333' }}>
                                    🏠 Dirección *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Calle 5 de Mayo #12, Col. Centro"
                                    value={checkoutData.customerAddress}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, customerAddress: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #ddd',
                                        fontSize: '0.95rem',
                                        transition: 'border-color 0.2s',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#e91e8c'}
                                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                />
                            </div>

                            <div style={{ marginBottom: '18px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#333' }}>
                                    📝 Referencia
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Frente a la tienda roja, casa azul"
                                    value={checkoutData.customerReference}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, customerReference: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #ddd',
                                        fontSize: '0.95rem',
                                        transition: 'border-color 0.2s',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#e91e8c'}
                                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                />
                            </div>

                            <div style={{
                                background: '#fff8e1',
                                border: '1px solid #ffe082',
                                borderRadius: '10px',
                                padding: '12px',
                                fontSize: '0.8rem',
                                color: '#f57f17',
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'flex-start',
                                marginBottom: '8px'
                            }}>
                                <span>💬</span>
                                <span>Te contactaremos por WhatsApp para coordinar la entrega de tu pedido.</span>
                            </div>
                        </form>
                    </div>

                    <div className="cart-footer" style={{ padding: '15px 20px' }}>
                        <button
                            type="submit"
                            form="checkout-form"
                            className="btn-primary btn-checkout"
                            disabled={isSubmitting}
                            style={{ opacity: isSubmitting ? 0.7 : 1 }}
                        >
                            {isSubmitting ? 'Procesando...' : `Confirmar Pedido · $${totalWithShipping.toFixed(2)}`}
                        </button>
                        <button
                            onClick={handleBackToCart}
                            style={{
                                width: '100%',
                                marginTop: '10px',
                                padding: '10px',
                                background: 'none',
                                border: '1px solid #ddd',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                color: '#666',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                            ← Volver al carrito
                        </button>
                    </div>
                </aside>
            </>
        );
    }

    // --- CART VIEW ---
    return (
        <>
            <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={handleClose}></div>
            <aside className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h3>Carrito de Compras ({cart.length})</h3>
                    <button className="close-cart" onClick={handleClose}>×</button>
                </div>

                <div className="cart-items">
                    {cart.length === 0 ? (
                        <div className="cart-empty">
                            <span>🛒</span>
                            <p>Tu carrito está vacío</p>
                            <button className="btn-continue" onClick={handleClose}>Explorar Productos</button>
                        </div>
                    ) : (
                        cart.map((item, index) => (
                            <div key={`${item._id}-${index}`} className="cart-item">
                                <img
                                    src={getImageUrl(item.image) || 'https://via.placeholder.com/80x100?text=PS'}
                                    alt={item.name}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='100'><rect fill='%23f0f0f0' width='80' height='100'/></svg>";
                                    }}
                                />
                                <div className="cart-item-info">
                                    <h4 className="cart-item-name">{item.name}</h4>
                                    <div className="cart-item-meta">
                                        {item.color && <span>Color: {item.color}</span>}
                                        {item.size && <span> | Talla: {item.size}</span>}
                                    </div>
                                    <div className="cart-item-price">${item.price}</div>
                                    <div className="cart-item-qty">
                                        <button
                                            className="cart-qty-btn"
                                            onClick={() => updateQty(item._id, item.color, item.size, item.qty - 1)}
                                        >-</button>
                                        <span>{item.qty}</span>
                                        <button
                                            className="cart-qty-btn"
                                            onClick={() => updateQty(item._id, item.color, item.size, item.qty + 1)}
                                        >+</button>
                                    </div>
                                </div>
                                <button
                                    className="remove-cart-item"
                                    onClick={() => removeFromCart(item._id, item.color, item.size)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-subtotal">
                            <span>Subtotal:</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="cart-shipping">
                            <span>Envío:</span>
                            <span>{cartTotal > 299 ? 'GRATIS' : '$99.00'}</span>
                        </div>
                        <div className="cart-total">
                            <span>Total:</span>
                            <span>${totalWithShipping.toFixed(2)}</span>
                        </div>
                        <button className="btn-primary btn-checkout" onClick={handleStartCheckout}>
                            Finalizar Compra
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
};

export default CartDrawer;
