import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

const Orders = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewingOrder, setReviewingOrder] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get('/orders/my');
                setOrders(res.data);
            } catch (err) {
                console.error('Error fetching orders:', err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchOrders();
    }, [user]);

    const handleSubmitReview = async (orderId) => {
        setSubmittingReview(true);
        try {
            await api.post(`/orders/${orderId}/review`, {
                rating: reviewRating,
                comment: reviewComment
            });
            showToast('¡Gracias por tu reseña!', 'success');
            setReviewingOrder(null);
            setReviewRating(5);
            setReviewComment('');
            // Refresh orders
            const res = await api.get('/orders/my');
            setOrders(res.data);
        } catch (err) {
            showToast(err.response?.data?.message || 'Error al enviar reseña', 'error');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (!user) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>Debes iniciar sesión para ver tus pedidos.</div>;

    return (
        <div className="orders-page" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '120px', paddingBottom: '60px' }}>
                <h1 style={{ marginBottom: '30px' }}>Mis Pedidos</h1>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <div className="loader"></div>
                        <p>Cargando tus pedidos...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="empty-orders" style={{ textAlign: 'center', background: 'white', padding: '60px', borderRadius: '15px' }}>
                        <span style={{ fontSize: '4rem' }}>📦</span>
                        <h3>Aún no has realizado pedidos</h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>¡Explora nuestra colección y estrena hoy mismo!</p>
                        <Link to="/" className="btn-primary">Ir a la Tienda</Link>
                    </div>
                ) : (
                    <div className="orders-list" style={{ display: 'grid', gap: '25px' }}>
                        {orders.map(order => (
                            <div key={order._id} className="order-card" style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                <div className="order-header" style={{ padding: '20px', background: '#fdfdff', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Pedido Realizado</div>
                                        <div style={{ fontWeight: '500' }}>{new Date(order.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Total</div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>${order.totalPrice.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>No. Pedido</div>
                                        <div style={{ fontFamily: 'monospace' }}>{order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}</div>
                                    </div>
                                    <div className="order-status-badge" style={{
                                        padding: '6px 15px',
                                        borderRadius: '25px',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        background: order.status === 'Entregado' ? '#ebfbee' : order.status === 'Enviado' ? '#e7f5ff' : order.status === 'Cancelado' ? '#fff0f0' : '#fff4e6',
                                        color: order.status === 'Entregado' ? '#2b8a3e' : order.status === 'Enviado' ? '#1971c2' : order.status === 'Cancelado' ? '#e03131' : '#e67700'
                                    }}>
                                        {order.status}
                                    </div>
                                </div>

                                <div className="order-body" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: '1', minWidth: '250px' }}>
                                            <h4 style={{ marginBottom: '15px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>Productos</h4>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center' }}>
                                                    <img src={getImageUrl(item.image)} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                            {item.qty} unidad(es) • {item.color} / {item.size}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontWeight: '600' }}>${(item.price * item.qty).toFixed(2)}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ width: '300px', background: '#fafafa', padding: '20px', borderRadius: '12px' }}>
                                            <h4 style={{ marginBottom: '15px' }}>Estatus de Entrega</h4>
                                            <div className="delivery-stepper" style={{ position: 'relative', paddingLeft: '30px' }}>
                                                <div style={{
                                                    position: 'absolute', left: '10px', top: '5px', bottom: '5px', width: '2px', background: '#ddd', zIndex: 1
                                                }}></div>

                                                <div style={{ marginBottom: '20px', position: 'relative' }}>
                                                    <div style={{ position: 'absolute', left: '-24px', top: '0', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', zIndex: 2 }}></div>
                                                    <strong>{order.status}</strong>
                                                    <p style={{ fontSize: '0.85rem', color: '#666', margin: '5px 0' }}>
                                                        {order.status === 'Preparando' && 'Estamos alistando tu paquete.'}
                                                        {order.status === 'Enviado' && 'Tu paquete ha salido de nuestro almacén.'}
                                                        {order.status === 'En Camino' && 'El repartidor está cerca de tu domicilio.'}
                                                        {order.status === 'Entregado' && '¡El pedido ha sido entregado!'}
                                                        {order.status === 'Cancelado' && 'Este pedido fue cancelado.'}
                                                    </p>
                                                </div>

                                                {order.status === 'Entregado' && order.deliveredAt ? (
                                                    <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                                        <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>ENTREGADO EL</div>
                                                        <div style={{ fontWeight: 'bold', color: '#2b8a3e', fontSize: '1.1rem' }}>
                                                            {new Date(order.deliveredAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                                        </div>
                                                    </div>
                                                ) : order.deliveryRange?.start && order.status !== 'Entregado' ? (
                                                    <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                                        <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>FECHA ESTIMADA DE ENTREGA</div>
                                                        <div style={{ fontWeight: 'bold', color: '#333', fontSize: '1.1rem' }}>
                                                            {new Date(order.deliveryRange.start).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' })} - {new Date(order.deliveryRange.end).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review Section - only for delivered orders */}
                                    {order.status === 'Entregado' && (
                                        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                            {order.review?.rating ? (
                                                /* Show existing review */
                                                <div style={{ background: '#f8f9fa', padding: '16px 20px', borderRadius: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#333' }}>Tu reseña</span>
                                                        <div style={{ display: 'flex', gap: '2px' }}>
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <span key={star} style={{ color: star <= order.review.rating ? '#f59f00' : '#ddd', fontSize: '1.1rem' }}>★</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {order.review.comment && (
                                                        <p style={{ color: '#555', fontSize: '0.9rem', fontStyle: 'italic' }}>"{order.review.comment}"</p>
                                                    )}
                                                    <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '6px' }}>
                                                        {new Date(order.review.reviewedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            ) : reviewingOrder === order._id ? (
                                                /* Show review form */
                                                <div style={{ background: '#fefefe', border: '1px solid #eee', padding: '20px', borderRadius: '12px' }}>
                                                    <h4 style={{ marginBottom: '15px', fontSize: '1rem' }}>⭐ Califica tu experiencia</h4>
                                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '15px' }}>
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onClick={() => setReviewRating(star)}
                                                                style={{
                                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                                    fontSize: '2rem', color: star <= reviewRating ? '#f59f00' : '#ddd',
                                                                    transition: 'transform 0.15s',
                                                                    transform: star <= reviewRating ? 'scale(1.1)' : 'scale(1)'
                                                                }}
                                                            >★</button>
                                                        ))}
                                                        <span style={{ alignSelf: 'center', marginLeft: '8px', fontSize: '0.85rem', color: '#888' }}>
                                                            {reviewRating === 1 && 'Malo'}
                                                            {reviewRating === 2 && 'Regular'}
                                                            {reviewRating === 3 && 'Bueno'}
                                                            {reviewRating === 4 && 'Muy bueno'}
                                                            {reviewRating === 5 && 'Excelente'}
                                                        </span>
                                                    </div>
                                                    <textarea
                                                        value={reviewComment}
                                                        onChange={(e) => setReviewComment(e.target.value)}
                                                        placeholder="Cuéntanos sobre tu experiencia (opcional)"
                                                        rows={3}
                                                        style={{
                                                            width: '100%', padding: '12px', borderRadius: '10px',
                                                            border: '1px solid #ddd', resize: 'vertical', fontSize: '0.9rem',
                                                            fontFamily: 'inherit', marginBottom: '12px'
                                                        }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button
                                                            onClick={() => handleSubmitReview(order._id)}
                                                            disabled={submittingReview}
                                                            className="btn-primary"
                                                            style={{ flex: 1, padding: '10px' }}
                                                        >
                                                            {submittingReview ? 'Enviando...' : 'Enviar Reseña'}
                                                        </button>
                                                        <button
                                                            onClick={() => { setReviewingOrder(null); setReviewRating(5); setReviewComment(''); }}
                                                            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontWeight: '500' }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Show review button */
                                                <button
                                                    onClick={() => setReviewingOrder(order._id)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                        background: 'linear-gradient(135deg, #f59f00, #e67700)',
                                                        color: 'white', border: 'none', padding: '10px 20px',
                                                        borderRadius: '10px', cursor: 'pointer', fontWeight: '600',
                                                        fontSize: '0.9rem', transition: 'opacity 0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                                >
                                                    ⭐ Dejar una Reseña
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
