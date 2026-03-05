import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../api';

const Navbar = ({ onSearch, onSearchSubmit, onCategoryChange, currentCategory }) => {
    const [showAnnouncement, setShowAnnouncement] = useState(true);
    const { cartCount, setIsOpen: setIsCartOpen } = useCart();
    const { wishlist, setIsOpen: setIsWishlistOpen } = useWishlist();
    const { user, setIsOpen: setIsAuthOpen, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const notifRef = useRef(null);

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (onSearch) onSearch(val);
    };

    const handleCatClick = (e, cat) => {
        e.preventDefault();
        setSearchQuery('');
        if (onSearch) onSearch('');
        if (onCategoryChange) onCategoryChange(cat);
    };

    // Fetch notifications
    useEffect(() => {
        if (!user) { setNotifications([]); setUnreadCount(0); return; }
        const fetchNotifs = async () => {
            try {
                const [notifsRes, countRes] = await Promise.all([
                    api.get('/notifications/my'),
                    api.get('/notifications/unread-count')
                ]);
                setNotifications(notifsRes.data);
                setUnreadCount(countRes.data.count);
            } catch (err) { /* silent */ }
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [user]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { /* silent */ }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) { /* silent */ }
    };

    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return `Hace ${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `Hace ${hrs}h`;
        const days = Math.floor(hrs / 24);
        return `Hace ${days}d`;
    };

    return (
        <header>
            {showAnnouncement && (
                <div className="announcement-bar" id="announcementBar">
                    <div className="announcement-inner">
                        <span>🔥 Envío GRATIS en pedidos +$299</span>
                        <span className="divider">|</span>
                        <span>✨ Nuevas llegadas cada semana</span>
                        <span className="divider">|</span>
                        <span>💳 Pago seguro garantizado</span>
                    </div>
                    <button
                        className="close-announcement"
                        id="closeAnnouncement"
                        onClick={() => setShowAnnouncement(false)}
                    >
                        ×
                    </button>
                </div>
            )}

            <nav className="navbar" id="navbar">
                <div className="nav-inner">
                    <Link to="/" className="logo">
                        <img src="/image.png" alt="Style-Leon" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span className="logo-text">Style-Leon</span>
                    </Link>

                    <div className="search-wrap">
                        <form className="search-bar" onSubmit={(e) => { e.preventDefault(); if (onSearchSubmit) onSearchSubmit(); }}>
                            <input
                                type="text"
                                placeholder="Buscar ropa, zapatos, accesorios…"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                            <button type="submit" className="search-btn" aria-label="Buscar">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                            </button>
                        </form>
                    </div>

                    <div className="nav-actions">
                        {/* Notifications Bell */}
                        {user && (
                            <div ref={notifRef} style={{ position: 'relative' }}>
                                <button
                                    className="nav-btn"
                                    aria-label="Notificaciones"
                                    onClick={() => setNotifOpen(!notifOpen)}
                                >
                                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                                </button>

                                {/* Notification Dropdown */}
                                {notifOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        width: '360px',
                                        maxHeight: '450px',
                                        background: 'white',
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
                                        zIndex: 1000,
                                        overflow: 'hidden',
                                        border: '1px solid #eee',
                                        animation: 'fadeIn 0.2s ease'
                                    }}>
                                        {/* Header */}
                                        <div style={{
                                            padding: '16px 20px',
                                            borderBottom: '1px solid #f0f0f0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: 'linear-gradient(135deg, #f8f9fa, #fff)'
                                        }}>
                                            <span style={{ fontWeight: '700', fontSize: '1rem' }}>🔔 Notificaciones</span>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllRead}
                                                    style={{
                                                        border: 'none',
                                                        background: 'none',
                                                        color: 'var(--primary)',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    Marcar todas leídas
                                                </button>
                                            )}
                                        </div>

                                        {/* Notifications List */}
                                        <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
                                            {notifications.length === 0 ? (
                                                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                                                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>🔕</span>
                                                    <p style={{ fontWeight: '500' }}>No tienes notificaciones</p>
                                                </div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div
                                                        key={n._id}
                                                        onClick={() => !n.read && markAsRead(n._id)}
                                                        style={{
                                                            padding: '14px 20px',
                                                            borderBottom: '1px solid #f5f5f5',
                                                            cursor: n.read ? 'default' : 'pointer',
                                                            background: n.read ? 'white' : 'linear-gradient(135deg, #fff5f7, #fff)',
                                                            transition: 'background 0.2s',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        {!n.read && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                left: '8px',
                                                                top: '50%',
                                                                transform: 'translateY(-50%)',
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                background: 'var(--primary)'
                                                            }} />
                                                        )}
                                                        <div style={{ marginLeft: n.read ? 0 : '10px' }}>
                                                            {n.image && (
                                                                <img
                                                                    src={getImageUrl(n.image)}
                                                                    alt=""
                                                                    style={{ width: '100%', height: '120px', borderRadius: '10px', objectFit: 'cover', marginBottom: '10px' }}
                                                                />
                                                            )}
                                                            <div style={{ fontWeight: n.read ? '500' : '700', fontSize: '0.88rem', marginBottom: '4px', color: '#222' }}>
                                                                {n.title}
                                                            </div>
                                                            <div style={{ fontSize: '0.82rem', color: '#666', lineHeight: '1.4' }}>
                                                                {n.message}
                                                            </div>
                                                            <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '6px' }}>
                                                                {timeAgo(n.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            className="nav-btn"
                            aria-label="Lista de deseos"
                            onClick={() => setIsWishlistOpen(true)}
                        >
                            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
                        </button>

                        <div className="user-nav">
                            <button
                                className="nav-btn"
                                aria-label="Mi cuenta"
                                onClick={() => user ? setUserDropdownOpen(!userDropdownOpen) : setIsAuthOpen(true)}
                            >
                                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                {user && <span className="nav-label">{user.name.split(' ')[0]}</span>}
                            </button>
                            {user && (
                                <div className={`user-dropdown ${userDropdownOpen ? 'open' : ''}`}>
                                    <div className="user-dd-header">
                                        <div className="user-dd-avatar">{user.name.charAt(0)}</div>
                                        <div>
                                            <div className="user-dd-name">{user.name}</div>
                                            <div className="user-dd-email">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className="user-dd-divider"></div>
                                    <Link to="/orders" className="user-dd-item" onClick={() => setUserDropdownOpen(false)}>
                                        Mis Pedidos
                                    </Link>
                                    {user.isAdmin && (
                                        <Link to="/admin" className="user-dd-item" onClick={() => setUserDropdownOpen(false)}>
                                            Panel de Control
                                        </Link>
                                    )}
                                    <button className="user-dd-item" onClick={() => { logout(); setUserDropdownOpen(false); }}>
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            className="nav-btn"
                            aria-label="Carrito"
                            onClick={() => setIsCartOpen(true)}
                        >
                            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            {cartCount > 0 && <span className="badge">{cartCount}</span>}
                        </button>
                    </div>
                </div>

                <div className="cat-nav">
                    <ul className="cat-nav-list">
                        <li><a href="#" className={`cat-link ${currentCategory === 'all' ? 'active' : ''}`} onClick={(e) => handleCatClick(e, 'all')}>Todo</a></li>
                        <li><a href="#" className={`cat-link ${currentCategory === 'mujer' ? 'active' : ''}`} onClick={(e) => handleCatClick(e, 'mujer')}>Mujer</a></li>
                        <li><a href="#" className={`cat-link ${currentCategory === 'hombre' ? 'active' : ''}`} onClick={(e) => handleCatClick(e, 'hombre')}>Hombre</a></li>
                        <li><a href="#" className={`cat-link ${currentCategory === 'calzado' ? 'active' : ''}`} onClick={(e) => handleCatClick(e, 'calzado')}>Calzado</a></li>
                        <li><a href="#" className={`cat-link ${currentCategory === 'accesorios' ? 'active' : ''}`} onClick={(e) => handleCatClick(e, 'accesorios')}>Accesorios</a></li>
                        <li><a href="#" className={`cat-link ${currentCategory === 'sale' ? 'active' : ''}`} onClick={(e) => handleCatClick(e, 'sale')}><span className="sale-badge">Ofertas</span></a></li>
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
