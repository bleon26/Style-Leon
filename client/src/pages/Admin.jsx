import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['22', '23', '24', '25', '26', '27', '28', '29', '30'];

const Admin = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Product State
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: 'mujer',
        price: '',
        originalPrice: '',
        description: '',
        sizes: '',
        isNewProduct: true,
        isSale: false
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);

    // Edit Product State
    const [isEditingProduct, setIsEditingProduct] = useState(null);
    const [editProduct, setEditProduct] = useState({
        name: '',
        category: '',
        price: '',
        originalPrice: '',
        description: '',
        sizes: ''
    });
    const [editSelectedSizes, setEditSelectedSizes] = useState([]);
    const [editFiles, setEditFiles] = useState([]);
    const [editPreviews, setEditPreviews] = useState([]);

    // Order Update State
    const [isEditingOrder, setIsEditingOrder] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [deliveryStart, setDeliveryStart] = useState('');
    const [deliveryEnd, setDeliveryEnd] = useState('');
    const [deliveredAt, setDeliveredAt] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);

    // Confirm Delete State
    const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'product'|'order'|'town', id, name }

    // Towns State
    const [towns, setTowns] = useState([]);
    const [newTownName, setNewTownName] = useState('');

    // Users State
    const [users, setUsers] = useState([]);

    // Notifications State
    const [adminNotifications, setAdminNotifications] = useState([]);
    const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'general', userId: '', sendToAll: false });
    const [isEditingNotif, setIsEditingNotif] = useState(null);
    const [editNotif, setEditNotif] = useState({ title: '', message: '', type: 'general' });

    // Carousel State
    const [carouselSlides, setCarouselSlides] = useState([]);
    const [isAddingSlide, setIsAddingSlide] = useState(false);
    const [isEditingSlide, setIsEditingSlide] = useState(null);
    const [newSlide, setNewSlide] = useState({
        tag: '',
        title: '',
        description: '',
        bgGradient: ['#1a1a2e', '#0f3460'],
        buttons: [{ text: '', action: 'scrollToProducts', style: 'btn-primary' }],
        showStats: false,
        stats: [{ value: '', label: '' }],
        showTimer: false,
        order: 0
    });
    const [slideFile, setSlideFile] = useState(null);
    const [slidePreview, setSlidePreview] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'products') {
                const res = await api.get('/products');
                setProducts(res.data);
            } else if (activeTab === 'orders') {
                const res = await api.get('/orders');
                setOrders(res.data);
            } else if (activeTab === 'towns') {
                const res = await api.get('/towns');
                setTowns(res.data);
            } else if (activeTab === 'carousel') {
                const res = await api.get('/carousel');
                setCarouselSlides(res.data);
            } else if (activeTab === 'users') {
                const res = await api.get('/auth/users');
                setUsers(res.data);
            } else if (activeTab === 'reviews') {
                const res = await api.get('/orders');
                const ordersWithReviews = res.data.filter(o => o.review?.rating);
                setOrders(ordersWithReviews);
            } else if (activeTab === 'notifications') {
                const [notifRes, usersRes] = await Promise.all([
                    api.get('/notifications/all'),
                    api.get('/auth/users')
                ]);
                setAdminNotifications(notifRes.data);
                setUsers(usersRes.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- Size Toggle Helpers ---
    const toggleSize = (size, currentSizes, setSizes, setField, fieldName) => {
        let updated;
        if (currentSizes.includes(size)) {
            updated = currentSizes.filter(s => s !== size);
        } else {
            updated = [...currentSizes, size];
        }
        setSizes(updated);
        setField(prev => ({ ...prev, [fieldName]: updated.join(', ') }));
    };

    const getSizePresets = (category) => {
        return category === 'calzado' ? SHOE_SIZES : COMMON_SIZES;
    };

    // --- File Handling for ADD ---
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const totalFiles = selectedFiles.length + files.length;
        if (totalFiles > 5) {
            alert('Puedes subir un máximo de 5 fotos en total.');
            return;
        }
        const newFiles = [...selectedFiles, ...files];
        setSelectedFiles(newFiles);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
        e.target.value = '';
    };

    const removeFile = (index) => {
        const updatedFiles = selectedFiles.filter((_, i) => i !== index);
        const updatedPreviews = previews.filter((_, i) => i !== index);
        URL.revokeObjectURL(previews[index]);
        setSelectedFiles(updatedFiles);
        setPreviews(updatedPreviews);
    };

    // --- File Handling for EDIT ---
    const handleEditFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 5) {
            alert('Puedes subir un máximo de 5 fotos.');
            return;
        }
        setEditFiles(files);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        // Revoke old previews
        editPreviews.forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); });
        setEditPreviews(newPreviews);
        e.target.value = '';
    };

    // --- Add Product ---
    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            if (selectedFiles.length < 3) {
                alert('Por favor selecciona al menos 3 imágenes.');
                return;
            }
            const formData = new FormData();
            formData.append('name', newProduct.name);
            formData.append('category', newProduct.category);
            formData.append('price', newProduct.price);
            formData.append('originalPrice', newProduct.originalPrice);
            formData.append('description', newProduct.description);
            formData.append('sizes', newProduct.sizes);
            formData.append('isNewProduct', newProduct.isNewProduct);
            formData.append('isSale', newProduct.isSale);
            selectedFiles.forEach(file => formData.append('images', file));
            await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            closeAddModal();
            fetchData();
        } catch (err) {
            alert('Error al añadir producto: ' + (err.response?.data?.message || err.message));
        }
    };

    const closeAddModal = () => {
        setIsAddingProduct(false);
        setNewProduct({ name: '', category: 'mujer', price: '', originalPrice: '', description: '', sizes: '', isNewProduct: true, isSale: false });
        setSelectedFiles([]);
        setPreviews([]);
        setSelectedSizes([]);
    };

    // --- Edit Product ---
    const openEditModal = (p) => {
        setIsEditingProduct(p._id);
        setEditProduct({
            name: p.name,
            category: p.category,
            price: p.price,
            originalPrice: p.originalPrice || '',
            description: p.description || '',
            sizes: p.sizes ? p.sizes.join(', ') : '',
            isSale: p.isSale || false
        });
        setEditSelectedSizes(p.sizes || []);
        setEditFiles([]);
        // Set existing images as previews
        const existingPreviews = (p.images && p.images.length > 0 ? p.images : [p.image])
            .map(img => getImageUrl(img));
        setEditPreviews(existingPreviews);
    };

    const handleEditProduct = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editProduct.name);
            formData.append('category', editProduct.category);
            formData.append('price', editProduct.price);
            formData.append('originalPrice', editProduct.originalPrice);
            formData.append('description', editProduct.description);
            formData.append('sizes', editProduct.sizes);
            formData.append('isSale', editProduct.isSale);

            if (editFiles.length > 0) {
                editFiles.forEach(file => formData.append('images', file));
            }

            await api.put(`/products/${isEditingProduct}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsEditingProduct(null);
            fetchData();
        } catch (err) {
            alert('Error al editar producto: ' + (err.response?.data?.message || err.message));
        }
    };

    // --- Delete Product ---
    const handleDeleteProduct = async (id) => {
        try {
            await api.delete(`/products/${id}`);
            setConfirmDelete(null);
            fetchData();
        } catch (err) {
            console.error('Delete error:', err.response?.data || err.message);
            alert('Error al eliminar producto: ' + (err.response?.data?.message || err.message));
        }
    };

    // --- Orders ---
    const handleUpdateOrder = async (e) => {
        e.preventDefault();
        try {
            const data = { status: editStatus };
            if (deliveryStart) data.deliveryStart = deliveryStart;
            if (deliveryEnd) data.deliveryEnd = deliveryEnd;
            if (editStatus === 'Entregado' && deliveredAt) data.deliveredAt = deliveredAt;
            await api.put(`/orders/${isEditingOrder}`, data);
            setIsEditingOrder(null);
            setDeliveryStart('');
            setDeliveryEnd('');
            setDeliveredAt('');
            fetchData();
        } catch (err) {
            alert('Error al actualizar el pedido');
        }
    };

    const handleDeleteOrder = async (id) => {
        try {
            await api.delete(`/orders/${id}`);
            setConfirmDelete(null);
            fetchData();
        } catch (err) {
            alert('Error al eliminar el pedido');
        }
    };

    const handleDeleteTown = async (id) => {
        try {
            await api.delete(`/towns/${id}`);
            setConfirmDelete(null);
            fetchData();
        } catch (err) {
            alert('Error al eliminar el pueblo');
        }
    };

    const executeDelete = () => {
        if (!confirmDelete) return;
        if (confirmDelete.type === 'product') {
            handleDeleteProduct(confirmDelete.id);
        } else if (confirmDelete.type === 'order') {
            handleDeleteOrder(confirmDelete.id);
        } else if (confirmDelete.type === 'town') {
            handleDeleteTown(confirmDelete.id);
        } else if (confirmDelete.type === 'carousel-slide') {
            handleDeleteCarouselSlide(confirmDelete.id);
        }
    };

    // --- Carousel Slides ---
    const handleAddCarouselSlide = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('tag', newSlide.tag);
            formData.append('title', newSlide.title);
            formData.append('description', newSlide.description);
            formData.append('bgGradient', JSON.stringify(newSlide.bgGradient));
            formData.append('buttons', JSON.stringify(newSlide.buttons));
            formData.append('showStats', newSlide.showStats);
            formData.append('stats', JSON.stringify(newSlide.stats));
            formData.append('showTimer', newSlide.showTimer);
            formData.append('order', newSlide.order);
            if (slideFile) formData.append('image', slideFile);

            await api.post('/carousel', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setIsAddingSlide(false);
            resetSlideForm();
            fetchData();
        } catch (err) {
            alert('Error al añadir slide: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEditCarouselSlide = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('tag', newSlide.tag);
            formData.append('title', newSlide.title);
            formData.append('description', newSlide.description);
            formData.append('bgGradient', JSON.stringify(newSlide.bgGradient));
            formData.append('buttons', JSON.stringify(newSlide.buttons));
            formData.append('showStats', newSlide.showStats);
            formData.append('stats', JSON.stringify(newSlide.stats));
            formData.append('showTimer', newSlide.showTimer);
            formData.append('order', newSlide.order);
            if (slideFile) formData.append('image', slideFile);

            await api.put(`/carousel/${isEditingSlide}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setIsEditingSlide(null);
            resetSlideForm();
            fetchData();
        } catch (err) {
            alert('Error al editar slide: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteCarouselSlide = async (id) => {
        try {
            await api.delete(`/carousel/${id}`);
            setConfirmDelete(null);
            fetchData();
        } catch (err) {
            alert('Error al eliminar slide');
        }
    };

    const resetSlideForm = () => {
        setNewSlide({
            tag: '', title: '', description: '',
            bgGradient: ['#1a1a2e', '#0f3460'],
            buttons: [{ text: '', action: 'scrollToProducts' }],
            showStats: false,
            stats: [{ value: '', label: '' }],
            showTimer: false,
            order: 0
        });
        setSlideFile(null);
        setSlidePreview('');
    };

    const openEditSlideModal = (slide) => {
        setIsEditingSlide(slide._id);
        setNewSlide({
            tag: slide.tag || '',
            title: slide.title || '',
            description: slide.description || '',
            bgGradient: slide.bgGradient || ['#1a1a2e', '#0f3460'],
            buttons: slide.buttons || [{ text: '', action: 'scrollToProducts', style: 'btn-primary' }],
            showStats: slide.showStats || false,
            stats: slide.stats || [{ value: '', label: '' }],
            showTimer: slide.showTimer || false,
            order: slide.order || 0
        });
        setSlidePreview(getImageUrl(slide.image));
        setSlideFile(null);
    };

    if (!user || !user.isAdmin) {
        return <Navigate to="/" />;
    }

    // --- Size Buttons Component ---
    const SizeButtons = ({ category, currentSizes, onToggle }) => {
        const presets = getSizePresets(category);
        return (
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                    Tallas disponibles:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {presets.map(size => {
                        const isActive = currentSizes.includes(size);
                        return (
                            <button
                                key={size}
                                type="button"
                                onClick={() => onToggle(size)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: isActive ? '2px solid var(--primary)' : '2px solid #ddd',
                                    background: isActive ? 'linear-gradient(135deg, #e91e8c, #7c3aed)' : 'white',
                                    color: isActive ? 'white' : '#555',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minWidth: '48px',
                                    minHeight: '38px',
                                    boxShadow: isActive ? '0 2px 8px rgba(233, 30, 140, 0.3)' : 'none'
                                }}
                            >
                                {size}
                            </button>
                        );
                    })}
                </div>
                <input
                    type="text"
                    placeholder="O escribe tallas personalizadas: 24, 25, 26..."
                    value={currentSizes.filter(s => !presets.includes(s)).join(', ')}
                    onChange={(e) => {
                        const custom = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        const preset = currentSizes.filter(s => presets.includes(s));
                        const combined = [...preset, ...custom];
                        // We won't call onToggle here, we need a different approach
                    }}
                    style={{
                        marginTop: '10px',
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '0.85rem'
                    }}
                />
            </div>
        );
    };

    // --- Close Button Component ---
    const CloseButton = ({ onClick }) => (
        <button
            type="button"
            onClick={onClick}
            style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid #eee',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                cursor: 'pointer',
                color: '#666',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                minWidth: 'auto',
                minHeight: 'auto',
                zIndex: 10
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#e03131'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#666'; }}
        >
            ✕
        </button>
    );

    return (
        <div className="admin-page" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
            <style>{`
                .admin-tabs-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
                .admin-tabs-scroll::-webkit-scrollbar { display: none; }
                .admin-tabs-inner { min-width: max-content; }
                .admin-tabs-inner button { white-space: nowrap; font-size: 0.9rem; }
                .admin-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                .admin-table-wrap table { min-width: 650px; }
                @media (max-width: 768px) {
                    .admin-grid-2 { grid-template-columns: 1fr !important; }
                    .admin-container-pad { padding-left: 12px !important; padding-right: 12px !important; padding-top: 80px !important; }
                    .admin-order-header { flex-direction: column; align-items: flex-start !important; gap: 8px !important; }
                    .admin-notif-form-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
            <Navbar />
            <div className="container admin-container-pad" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ marginBottom: '20px', fontSize: 'clamp(1.3rem, 4vw, 1.8rem)' }}>Panel de Administración</h1>
                    <div className="admin-tabs-scroll" style={{ borderBottom: '1px solid #ddd' }}>
                        <div className="admin-tabs admin-tabs-inner" style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setActiveTab('products')}
                                style={{ padding: '10px 14px', border: 'none', background: 'none', borderBottom: activeTab === 'products' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: activeTab === 'products' ? 'bold' : 'normal' }}
                            >
                                Productos
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                style={{ padding: '10px 14px', border: 'none', background: 'none', borderBottom: activeTab === 'orders' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: activeTab === 'orders' ? 'bold' : 'normal' }}
                            >
                                Pedidos ({orders.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('towns')}
                                style={{ padding: '10px 14px', border: 'none', background: 'none', borderBottom: activeTab === 'towns' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: activeTab === 'towns' ? 'bold' : 'normal' }}
                            >
                                🏘️ Pueblos
                            </button>
                            <button
                                onClick={() => setActiveTab('carousel')}
                                style={{ padding: '10px 14px', border: 'none', background: 'none', borderBottom: activeTab === 'carousel' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: activeTab === 'carousel' ? 'bold' : 'normal' }}
                            >
                                🖼️ Carrusel
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                style={{ padding: '10px 14px', border: 'none', background: 'none', borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: activeTab === 'users' ? 'bold' : 'normal' }}
                            >
                                👥 Usuarios
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                style={{ padding: '10px 14px', border: 'none', background: 'none', borderBottom: activeTab === 'reviews' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: activeTab === 'reviews' ? 'bold' : 'normal' }}
                            >
                                ⭐ Reseñas
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                style={{ padding: '10px 14px', border: 'none', background: 'none', borderBottom: activeTab === 'notifications' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: activeTab === 'notifications' ? 'bold' : 'normal' }}
                            >
                                🔔 Notificaciones
                            </button>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <div className="loader"></div>
                        <p>Cargando información...</p>
                    </div>
                ) : activeTab === 'products' ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <button className="btn-primary" onClick={() => setIsAddingProduct(true)}>Añadir Producto</button>
                        </div>
                        <div className="admin-table-wrap" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f1f3f5' }}>
                                    <tr>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Producto</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Categoría</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Precio</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Tallas</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <img src={getImageUrl(p.image)} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                                <span>{p.name}</span>
                                            </td>
                                            <td style={{ padding: '15px', textTransform: 'capitalize' }}>{p.category}</td>
                                            <td style={{ padding: '15px' }}>${p.price}</td>
                                            <td style={{ padding: '15px' }}>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {p.sizes && p.sizes.length > 0 ? p.sizes.map(s => (
                                                        <span key={s} style={{
                                                            padding: '2px 8px',
                                                            background: '#f0f0f0',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '500'
                                                        }}>{s}</span>
                                                    )) : <span style={{ color: '#aaa', fontSize: '0.8rem' }}>—</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <button
                                                    onClick={() => openEditModal(p)}
                                                    style={{
                                                        color: 'white',
                                                        background: 'linear-gradient(135deg, #228be6, #7c3aed)',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        marginRight: '8px',
                                                        padding: '6px 14px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                >
                                                    ✏️ Editar
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete({ type: 'product', id: p._id, name: p.name })}
                                                    style={{
                                                        color: 'white',
                                                        background: 'linear-gradient(135deg, #e03131, #c92a2a)',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '6px 14px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'orders' ? (
                    <div>
                        {orders.length === 0 ? (
                            <div style={{ textAlign: 'center', background: 'white', padding: '60px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <span style={{ fontSize: '4rem' }}>📋</span>
                                <h3 style={{ marginTop: '15px' }}>No hay pedidos aún</h3>
                                <p style={{ color: '#666' }}>Los pedidos de los clientes aparecerán aquí.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {orders.map(o => (
                                    <div key={o._id} style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                                        <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: expandedOrder === o._id ? '1px solid #f0f0f0' : 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                                            onClick={() => setExpandedOrder(expandedOrder === o._id ? null : o._id)}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '200px' }}>
                                                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #e91e8c, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.75rem', flexShrink: 0 }}>📦</div>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{o.orderNumber || `#${o._id.slice(-6).toUpperCase()}`}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(o.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '600', fontSize: '0.8rem', color: '#888' }}>{o.user?.name || 'Sin nombre'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{o.user?.email}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>${o.totalPrice.toFixed(2)}</div>
                                                <span style={{
                                                    padding: '5px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600',
                                                    background: o.status === 'Entregado' ? '#ebfbee' : o.status === 'Enviado' ? '#e7f5ff' : o.status === 'Cancelado' ? '#fff5f5' : '#fff4e6',
                                                    color: o.status === 'Entregado' ? '#2b8a3e' : o.status === 'Enviado' ? '#1971c2' : o.status === 'Cancelado' ? '#c92a2a' : '#e67700'
                                                }}>{o.status}</span>
                                                <span style={{ transform: expandedOrder === o._id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', fontSize: '0.8rem', color: '#aaa' }}>▼</span>
                                            </div>
                                        </div>
                                        {expandedOrder === o._id && (
                                            <div style={{ padding: '20px', background: '#fafafa' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                                    <div>
                                                        <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', color: '#555' }}>🛍️ Productos ({o.items.length})</h4>
                                                        {o.items.map((item, idx) => (
                                                            <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', background: 'white', padding: '10px', borderRadius: '10px', border: '1px solid #eee', alignItems: 'center' }}>
                                                                <img src={getImageUrl(item.image)} alt="" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{item.qty}x · ${item.price} {item.color && `· ${item.color}`} {item.size && `· Talla ${item.size}`}</div>
                                                                </div>
                                                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#333' }}>${(item.price * item.qty).toFixed(2)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div>
                                                        <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', color: '#555' }}>👤 Información del Cliente</h4>
                                                        <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #eee' }}>
                                                            {o.customerName && (
                                                                <div style={{ marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Nombre</span>
                                                                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>👤 {o.customerName}</span>
                                                                </div>
                                                            )}
                                                            {o.customerEmail && (
                                                                <div style={{ marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Correo</span>
                                                                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>✉️ {o.customerEmail}</span>
                                                                </div>
                                                            )}
                                                            {(o.customerPhone || o.phone) && (
                                                                <div style={{ marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Teléfono / WhatsApp</span>
                                                                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>📱 {o.customerPhone || o.phone}</span>
                                                                </div>
                                                            )}
                                                            {o.customerTown && (
                                                                <div style={{ marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Pueblo</span>
                                                                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>📍 {o.customerTown}</span>
                                                                </div>
                                                            )}
                                                            {o.customerAddress && (
                                                                <div style={{ marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Dirección</span>
                                                                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>🏠 {o.customerAddress}</span>
                                                                </div>
                                                            )}
                                                            {o.customerReference && (
                                                                <div style={{ marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Referencia</span>
                                                                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>📝 {o.customerReference}</span>
                                                                </div>
                                                            )}
                                                            {o.notes && (
                                                                <div style={{ marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Notas</span>
                                                                    <span style={{ fontWeight: '500', fontSize: '0.9rem', fontStyle: 'italic' }}>"{o.notes}"</span>
                                                                </div>
                                                            )}
                                                            {o.deliveryRange?.start && (
                                                                <div>
                                                                    <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Entrega Estimada</span>
                                                                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{new Date(o.deliveryRange.start).toLocaleDateString()} - {new Date(o.deliveryRange.end).toLocaleDateString()}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                            <button className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                                                                onClick={() => { setIsEditingOrder(o._id); setEditStatus(o.status); }}>
                                                                ✏️ Gestionar
                                                            </button>
                                                            <button style={{ padding: '10px 16px', background: '#fff5f5', color: '#e03131', border: '1px solid #ffc9c9', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s' }}
                                                                onClick={() => setConfirmDelete({ type: 'order', id: o._id, name: o.orderNumber || `#${o._id.slice(-6).toUpperCase()}` })}
                                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#ffe3e3'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff5f5'; }}>
                                                                🗑️ Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : activeTab === 'towns' ? (
                    <div>
                        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '25px', marginBottom: '20px' }}>
                            <h3 style={{ marginBottom: '15px', fontSize: '1rem' }}>➕ Agregar Pueblo</h3>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!newTownName.trim()) return;
                                try {
                                    await api.post('/towns', { name: newTownName.trim() });
                                    setNewTownName('');
                                    fetchData();
                                } catch (err) {
                                    alert(err.response?.data?.message || 'Error al agregar pueblo');
                                }
                            }} style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    value={newTownName}
                                    onChange={(e) => setNewTownName(e.target.value)}
                                    placeholder="Nombre del pueblo..."
                                    style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '0.95rem', outline: 'none' }}
                                />
                                <button type="submit" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '10px', whiteSpace: 'nowrap' }}>Agregar</button>
                            </form>
                        </div>

                        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', fontWeight: '600', color: '#555' }}>
                                Pueblos disponibles ({towns.length})
                            </div>
                            {towns.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
                                    <p>🏘️ No hay pueblos registrados</p>
                                </div>
                            ) : (
                                towns.map(t => (
                                    <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>📍</span>
                                            <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{t.name}</span>
                                        </div>
                                        <button
                                            onClick={() => setConfirmDelete({ type: 'town', id: t._id, name: t.name })}
                                            style={{ color: '#e03131', background: '#fff5f5', border: '1px solid #ffc9c9', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#ffe3e3'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff5f5'}
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : activeTab === 'carousel' ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <button className="btn-primary" onClick={() => { resetSlideForm(); setIsAddingSlide(true); }}>Añadir Slide</button>
                        </div>
                        <div className="admin-table-wrap" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f1f3f5' }}>
                                    <tr>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Orden</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Imagen</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Título</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Tag</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carouselSlides.map(slide => (
                                        <tr key={slide._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px' }}>{slide.order}</td>
                                            <td style={{ padding: '15px' }}>
                                                <img src={getImageUrl(slide.image)} alt="" style={{ width: '80px', height: '45px', borderRadius: '4px', objectFit: 'cover' }} />
                                            </td>
                                            <td style={{ padding: '15px' }} dangerouslySetInnerHTML={{ __html: slide.title }}></td>
                                            <td style={{ padding: '15px' }}>{slide.tag}</td>
                                            <td style={{ padding: '15px' }}>
                                                <button
                                                    onClick={() => openEditSlideModal(slide)}
                                                    style={{ color: 'white', background: 'linear-gradient(135deg, #228be6, #7c3aed)', border: 'none', cursor: 'pointer', marginRight: '8px', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}
                                                >✏️ Editar</button>
                                                <button
                                                    onClick={() => setConfirmDelete({ type: 'carousel-slide', id: slide._id, name: slide.tag || slide.title })}
                                                    style={{ color: 'white', background: 'linear-gradient(135deg, #e03131, #c92a2a)', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}
                                                >🗑️ Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* ============ MODAL: AÑADIR PRODUCTO ============ */}
            {isAddingProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
                    onClick={closeAddModal}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}>
                        <CloseButton onClick={closeAddModal} />
                        <h3 style={{ marginBottom: '25px', paddingRight: '40px' }}>Añadir Nuevo Producto</h3>
                        <form onSubmit={handleAddProduct}>
                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Nombre del Producto</label>
                                    <input required type="text" placeholder="Ej: Vestido Elegante" value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Categoría</label>
                                    <select value={newProduct.category}
                                        onChange={(e) => { setNewProduct({ ...newProduct, category: e.target.value }); setSelectedSizes([]); }}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                        <option value="mujer">Mujer</option>
                                        <option value="hombre">Hombre</option>
                                        <option value="calzado">Calzado</option>
                                        <option value="accesorios">Accesorios</option>
                                    </select>
                                </div>
                            </div>

                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Precio Actual ($)</label>
                                    <input required type="number" placeholder="499" value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Precio Original (Opcional)</label>
                                    <input type="number" placeholder="699" value={newProduct.originalPrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                            </div>

                            {/* Size Buttons */}
                            <SizeButtons
                                category={newProduct.category}
                                currentSizes={selectedSizes}
                                onToggle={(size) => toggleSize(size, selectedSizes, setSelectedSizes, setNewProduct, 'sizes')}
                            />

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Descripción</label>
                                <textarea placeholder="Detalles del producto..." rows="3" value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}></textarea>
                            </div>

                            {/* Oferta Toggle */}
                            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button type="button"
                                    onClick={() => setNewProduct({ ...newProduct, isSale: !newProduct.isSale })}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
                                        fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s',
                                        border: newProduct.isSale ? '2px solid #e03131' : '2px solid #ddd',
                                        background: newProduct.isSale ? 'linear-gradient(135deg, #ffe3e3, #fff5f5)' : '#f8f9fa',
                                        color: newProduct.isSale ? '#e03131' : '#666'
                                    }}
                                >
                                    {newProduct.isSale ? '🔥' : '🏷️'} {newProduct.isSale ? 'En Oferta ✓' : 'Marcar como Oferta'}
                                </button>
                                {newProduct.isSale && <span style={{ fontSize: '0.8rem', color: '#e03131' }}>Aparecerá en la sección de ofertas</span>}
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>Subir Fotos (3-5)</label>
                                <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ marginBottom: '15px' }} />
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {previews.map((url, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button type="button" onClick={() => removeFile(idx)}
                                                style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(255,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'auto', minHeight: 'auto' }}>×</button>
                                        </div>
                                    ))}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#888' }}>* Selecciona al menos 3 fotos desde tu dispositivo.</span>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Publicar Producto</button>
                                <button type="button" className="btn-outline" style={{ flex: 1, color: '#333', borderColor: '#ddd' }} onClick={closeAddModal}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ MODAL: EDITAR PRODUCTO ============ */}
            {isEditingProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
                    onClick={() => setIsEditingProduct(null)}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}>
                        <CloseButton onClick={() => setIsEditingProduct(null)} />
                        <h3 style={{ marginBottom: '25px', paddingRight: '40px' }}>Editar Producto</h3>
                        <form onSubmit={handleEditProduct}>
                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Nombre</label>
                                    <input required type="text" value={editProduct.name}
                                        onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Categoría</label>
                                    <select value={editProduct.category}
                                        onChange={(e) => { setEditProduct({ ...editProduct, category: e.target.value }); }}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                        <option value="mujer">Mujer</option>
                                        <option value="hombre">Hombre</option>
                                        <option value="calzado">Calzado</option>
                                        <option value="accesorios">Accesorios</option>
                                    </select>
                                </div>
                            </div>

                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Precio ($)</label>
                                    <input required type="number" value={editProduct.price}
                                        onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Precio Original</label>
                                    <input type="number" value={editProduct.originalPrice}
                                        onChange={(e) => setEditProduct({ ...editProduct, originalPrice: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                            </div>

                            {/* Size Buttons for Edit */}
                            <SizeButtons
                                category={editProduct.category}
                                currentSizes={editSelectedSizes}
                                onToggle={(size) => toggleSize(size, editSelectedSizes, setEditSelectedSizes, setEditProduct, 'sizes')}
                            />

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Descripción</label>
                                <textarea rows="3" value={editProduct.description}
                                    onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}></textarea>
                            </div>

                            {/* Oferta Toggle */}
                            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button type="button"
                                    onClick={() => setEditProduct({ ...editProduct, isSale: !editProduct.isSale })}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
                                        fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s',
                                        border: editProduct.isSale ? '2px solid #e03131' : '2px solid #ddd',
                                        background: editProduct.isSale ? 'linear-gradient(135deg, #ffe3e3, #fff5f5)' : '#f8f9fa',
                                        color: editProduct.isSale ? '#e03131' : '#666'
                                    }}
                                >
                                    {editProduct.isSale ? '🔥' : '🏷️'} {editProduct.isSale ? 'En Oferta ✓' : 'Marcar como Oferta'}
                                </button>
                                {editProduct.isSale && <span style={{ fontSize: '0.8rem', color: '#e03131' }}>Aparecerá en la sección de ofertas</span>}
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>Imágenes actuales</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                    {editPreviews.map((url, idx) => (
                                        <div key={idx} style={{ width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                </div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#666' }}>Reemplazar imágenes (opcional):</label>
                                <input type="file" multiple accept="image/*" onChange={handleEditFileChange} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar Cambios</button>
                                <button type="button" className="btn-outline" style={{ flex: 1, color: '#333', borderColor: '#ddd' }} onClick={() => setIsEditingProduct(null)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ MODAL: AÑADIR/EDITAR SLIDE ============ */}
            {(isAddingSlide || isEditingSlide) && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
                    onClick={() => { setIsAddingSlide(false); setIsEditingSlide(null); resetSlideForm(); }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}>
                        <CloseButton onClick={() => { setIsAddingSlide(false); setIsEditingSlide(null); resetSlideForm(); }} />
                        <h3 style={{ marginBottom: '25px' }}>{isEditingSlide ? 'Editar Slide' : 'Añadir Nuevo Slide'}</h3>
                        <form onSubmit={isEditingSlide ? handleEditCarouselSlide : handleAddCarouselSlide}>
                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Título (HTML permitido)</label>
                                    <input required type="text" placeholder="Ej: Moda que <br>Te Define" value={newSlide.title}
                                        onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Etiqueta (Tag)</label>
                                    <input type="text" placeholder="Ej: ✨ Nueva Colección" value={newSlide.tag}
                                        onChange={(e) => setNewSlide({ ...newSlide, tag: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Descripción</label>
                                <textarea placeholder="Descripción del slide..." rows="2" value={newSlide.description}
                                    onChange={(e) => setNewSlide({ ...newSlide, description: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}></textarea>
                            </div>

                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Color Gradiente 1</label>
                                    <input type="color" value={newSlide.bgGradient[0]}
                                        onChange={(e) => {
                                            const grad = [...newSlide.bgGradient];
                                            grad[0] = e.target.value;
                                            setNewSlide({ ...newSlide, bgGradient: grad });
                                        }}
                                        style={{ width: '100%', height: '40px', padding: '2px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Color Gradiente 2</label>
                                    <input type="color" value={newSlide.bgGradient[1]}
                                        onChange={(e) => {
                                            const grad = [...newSlide.bgGradient];
                                            grad[1] = e.target.value;
                                            setNewSlide({ ...newSlide, bgGradient: grad });
                                        }}
                                        style={{ width: '100%', height: '40px', padding: '2px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>Botones</label>
                                {newSlide.buttons.map((btn, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <input placeholder="Texto del botón" value={btn.text}
                                            onChange={(e) => {
                                                const btns = [...newSlide.buttons];
                                                btns[idx].text = e.target.value;
                                                setNewSlide({ ...newSlide, buttons: btns });
                                            }}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                        <select value={btn.action}
                                            onChange={(e) => {
                                                const btns = [...newSlide.buttons];
                                                btns[idx].action = e.target.value;
                                                setNewSlide({ ...newSlide, buttons: btns });
                                            }}
                                            style={{ width: '130px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                            <option value="scrollToProducts">Ir a Prod.</option>
                                            <option value="scrollToSale">Ir a Ofertas</option>
                                        </select>
                                        <select value={btn.style || 'btn-primary'}
                                            onChange={(e) => {
                                                const btns = [...newSlide.buttons];
                                                btns[idx].style = e.target.value;
                                                setNewSlide({ ...newSlide, buttons: btns });
                                            }}
                                            style={{ width: '120px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                            <option value="btn-primary">Primary</option>
                                            <option value="btn-outline">Outline</option>
                                            <option value="btn-glass">Glass</option>
                                        </select>
                                        <button type="button" onClick={() => {
                                            const btns = newSlide.buttons.filter((_, i) => i !== idx);
                                            setNewSlide({ ...newSlide, buttons: btns });
                                        }} style={{ padding: '10px', background: '#fee', color: '#e33', border: '1px solid #fcc', borderRadius: '8px' }}>🗑️</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => {
                                    setNewSlide({ ...newSlide, buttons: [...newSlide.buttons, { text: 'Nuevo Botón', action: 'scrollToProducts' }] });
                                }} style={{ fontSize: '0.8rem', padding: '5px 10px', borderRadius: '5px', border: '1px solid #ddd', background: '#f9f9f9' }}>+ Añadir Botón</button>
                            </div>

                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>Imagen del Slide</label>
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setSlideFile(file);
                                            setSlidePreview(URL.createObjectURL(file));
                                        }
                                    }} style={{ marginBottom: '10px' }} />
                                    {slidePreview && (
                                        <div style={{ width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                                            <img src={slidePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f5f5f5' }} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Orden de Aparición</label>
                                    <input type="number" value={newSlide.order}
                                        onChange={(e) => setNewSlide({ ...newSlide, order: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                    <div style={{ marginTop: '15px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input type="checkbox" checked={newSlide.showStats} onChange={(e) => setNewSlide({ ...newSlide, showStats: e.target.checked })} />
                                            Mostrar Estadísticas
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', marginTop: '10px' }}>
                                            <input type="checkbox" checked={newSlide.showTimer} onChange={(e) => setNewSlide({ ...newSlide, showTimer: e.target.checked })} />
                                            Mostrar Contador Flash
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{isEditingSlide ? 'Guardar Cambios' : 'Crear Slide'}</button>
                                <button type="button" className="btn-outline" style={{ flex: 1, color: '#333', borderColor: '#ddd' }} onClick={() => { setIsAddingSlide(false); setIsEditingSlide(null); resetSlideForm(); }}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ MODAL: GESTIÓN PEDIDO ============ */}
            {isEditingOrder && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
                    onClick={() => setIsEditingOrder(null)}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '100%', maxWidth: '400px', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}>
                        <CloseButton onClick={() => setIsEditingOrder(null)} />
                        <h3 style={{ marginBottom: '20px' }}>Actualizar Pedido</h3>
                        <form onSubmit={handleUpdateOrder}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Estado del Envío</label>
                                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                    <option value="Preparando">Preparando</option>
                                    <option value="Enviado">Enviado</option>
                                    <option value="En Camino">En Camino</option>
                                    <option value="Entregado">Entregado</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Rango Estimado - Inicio</label>
                                <input type="date" value={deliveryStart} onChange={(e) => setDeliveryStart(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Rango Estimado - Fin</label>
                                <input type="date" value={deliveryEnd} onChange={(e) => setDeliveryEnd(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>
                            {editStatus === 'Entregado' && (
                                <div style={{ marginBottom: '15px', background: '#ebfbee', padding: '12px', borderRadius: '10px', border: '1px solid #b2f2bb' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2b8a3e' }}>✅ Fecha en que se entregó</label>
                                    <input type="date" value={deliveredAt} onChange={(e) => setDeliveredAt(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #b2f2bb' }} required />
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
                                <button type="button" className="btn-outline" style={{ flex: 1, color: '#333', borderColor: '#ddd' }} onClick={() => setIsEditingOrder(null)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ TAB: USUARIOS ============ */}
            {activeTab === 'users' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>👥 Usuarios Registrados ({users.length})</h2>
                    </div>

                    {users.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px' }}>
                            <p style={{ fontSize: '3rem', marginBottom: '10px' }}>👥</p>
                            <p style={{ color: '#999' }}>No hay usuarios registrados</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {users.map(u => (
                                <div key={u._id} style={{
                                    background: 'white', borderRadius: '14px', padding: '20px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    background: u.isAdmin ? 'linear-gradient(135deg, #e03131, #c2255c)' : 'linear-gradient(135deg, #7048e8, #5f3dc4)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontWeight: '700', fontSize: '1rem', flexShrink: 0
                                                }}>
                                                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '2px' }}>
                                                        {u.name}
                                                        {u.isAdmin && <span style={{ background: '#fee2e2', color: '#e03131', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', marginLeft: '8px', fontWeight: '600' }}>ADMIN</span>}
                                                    </p>
                                                    <p style={{ color: '#666', fontSize: '0.85rem' }}>📧 {u.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#999', textAlign: 'right' }}>
                                            {new Date(u.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <div style={{
                                        marginTop: '12px', padding: '10px 14px', background: '#f8f9fa',
                                        borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.72rem',
                                        color: '#666', wordBreak: 'break-all', lineHeight: '1.5'
                                    }}>
                                        <span style={{ fontWeight: '600', color: '#333', fontFamily: 'inherit' }}>🔒 Hash: </span>
                                        {u.password}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ============ TAB: RESEÑAS ============ */}
            {activeTab === 'reviews' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>⭐ Reseñas de Clientes ({orders.length})</h2>
                    </div>

                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px' }}>
                            <p style={{ fontSize: '3rem', marginBottom: '10px' }}>⭐</p>
                            <p style={{ color: '#999' }}>Aún no hay reseñas</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {orders.map(order => (
                                <div key={order._id} style={{
                                    background: 'white', borderRadius: '14px', padding: '20px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #f59f00, #e67700)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0
                                                }}>
                                                    {order.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{order.user?.name || 'Usuario'}</p>
                                                    <p style={{ fontSize: '0.75rem', color: '#999' }}>{order.user?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#888' }}>{order.orderNumber || `#${order._id.slice(-8)}`}</p>
                                            <p style={{ fontSize: '0.7rem', color: '#aaa' }}>
                                                {new Date(order.review.reviewedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} style={{ color: star <= order.review.rating ? '#f59f00' : '#ddd', fontSize: '1.3rem' }}>★</span>
                                        ))}
                                        <span style={{ marginLeft: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#333' }}>
                                            {order.review.rating}/5
                                        </span>
                                    </div>

                                    {order.review.comment && (
                                        <p style={{ color: '#555', fontSize: '0.9rem', fontStyle: 'italic', background: '#f8f9fa', padding: '10px 14px', borderRadius: '8px', lineHeight: '1.5' }}>
                                            "{order.review.comment}"
                                        </p>
                                    )}

                                    <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#888' }}>
                                        {order.items.length} producto(s) • Total: ${order.totalPrice.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ============ TAB: NOTIFICACIONES ============ */}
            {activeTab === 'notifications' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>🔔 Gestión de Notificaciones</h2>
                    </div>

                    {/* Send New Notification */}
                    <div style={{ background: 'linear-gradient(135deg, #f8f9fa, #fff)', borderRadius: '16px', padding: '25px', marginBottom: '30px', border: '1px solid #eee' }}>
                        <h3 style={{ marginBottom: '18px', fontSize: '1rem' }}>📤 Enviar Nueva Notificación</h3>
                        <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: '600' }}>Título</label>
                                <input
                                    placeholder="Ej: ¡Oferta especial!"
                                    value={newNotif.title}
                                    onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: '600' }}>Tipo</label>
                                <select
                                    value={newNotif.type}
                                    onChange={(e) => setNewNotif({ ...newNotif, type: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="general">📌 General</option>
                                    <option value="promo">🎉 Promoción</option>
                                    <option value="order">📦 Pedido</option>
                                    <option value="status">🔄 Estatus</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: '600' }}>Mensaje</label>
                            <textarea
                                placeholder="Escribe el mensaje de la notificación..."
                                value={newNotif.message}
                                onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
                                rows="3"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: '600' }}>Imagen (Opcional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setNewNotif({ ...newNotif, image: e.target.files[0] })}
                                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={newNotif.sendToAll}
                                    onChange={(e) => setNewNotif({ ...newNotif, sendToAll: e.target.checked, userId: '' })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Enviar a todos los usuarios</span>
                            </label>
                        </div>
                        {!newNotif.sendToAll && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: '600' }}>Seleccionar Usuario</label>
                                <select
                                    value={newNotif.userId}
                                    onChange={(e) => setNewNotif({ ...newNotif, userId: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="">-- Selecciona un usuario --</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <button
                            className="btn-primary"
                            onClick={async () => {
                                try {
                                    const formData = new FormData();
                                    formData.append('title', newNotif.title);
                                    formData.append('message', newNotif.message);
                                    formData.append('type', newNotif.type);
                                    formData.append('sendToAll', newNotif.sendToAll);
                                    if (!newNotif.sendToAll) formData.append('userId', newNotif.userId);
                                    if (newNotif.image) formData.append('image', newNotif.image);

                                    await api.post('/notifications', formData, {
                                        headers: { 'Content-Type': 'multipart/form-data' }
                                    });
                                    setNewNotif({ title: '', message: '', type: 'general', userId: '', sendToAll: false, image: null });
                                    fetchData();
                                    alert('✅ Notificación enviada exitosamente');
                                } catch (err) {
                                    alert('Error: ' + (err.response?.data?.message || err.message));
                                }
                            }}
                            style={{ padding: '12px 30px' }}
                        >
                            {newNotif.sendToAll ? '📢 Enviar a Todos' : '📤 Enviar Notificación'}
                        </button>
                    </div>

                    {/* Notifications List */}
                    {adminNotifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🔕</span>
                            <p>No hay notificaciones enviadas</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {adminNotifications.map(n => (
                                <div key={n._id} style={{
                                    background: 'white', borderRadius: '12px', padding: '18px 20px',
                                    border: '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                }}>
                                    {isEditingNotif === n._id ? (
                                        <div>
                                            <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                                <input
                                                    value={editNotif.title}
                                                    onChange={(e) => setEditNotif({ ...editNotif, title: e.target.value })}
                                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                                />
                                                <select
                                                    value={editNotif.type}
                                                    onChange={(e) => setEditNotif({ ...editNotif, type: e.target.value })}
                                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                                >
                                                    <option value="general">General</option>
                                                    <option value="promo">Promoción</option>
                                                    <option value="order">Pedido</option>
                                                    <option value="status">Estatus</option>
                                                </select>
                                            </div>
                                            <textarea
                                                value={editNotif.message}
                                                onChange={(e) => setEditNotif({ ...editNotif, message: e.target.value })}
                                                rows="2"
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '10px' }}
                                            />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                                                    onClick={async () => {
                                                        try {
                                                            await api.put(`/notifications/${n._id}`, editNotif);
                                                            setIsEditingNotif(null);
                                                            fetchData();
                                                        } catch (err) { alert('Error al actualizar'); }
                                                    }}>Guardar</button>
                                                <button className="btn-outline" style={{ padding: '6px 16px', fontSize: '0.85rem', color: '#666' }}
                                                    onClick={() => setIsEditingNotif(null)}>Cancelar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{n.title}</span>
                                                    <span style={{
                                                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '600',
                                                        background: n.type === 'order' ? '#e3f2fd' : n.type === 'status' ? '#fff3e0' : n.type === 'promo' ? '#fce4ec' : '#f3e5f5',
                                                        color: n.type === 'order' ? '#1565c0' : n.type === 'status' ? '#e65100' : n.type === 'promo' ? '#c62828' : '#6a1b9a'
                                                    }}>
                                                        {n.type === 'order' ? '📦 Pedido' : n.type === 'status' ? '🔄 Estatus' : n.type === 'promo' ? '🎉 Promo' : '📌 General'}
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: n.read ? '#e8f5e9' : '#fff8e1', color: n.read ? '#2e7d32' : '#f57f17', fontWeight: '600' }}>
                                                        {n.read ? '✓ Leída' : '● No leída'}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: '#555', margin: '0 0 6px 0', lineHeight: '1.4' }}>{n.message}</p>
                                                <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                                                    👤 {n.user?.name || 'Usuario'} ({n.user?.email || ''}) • {new Date(n.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '10px' }}>
                                                <button
                                                    onClick={() => { setIsEditingNotif(n._id); setEditNotif({ title: n.title, message: n.message, type: n.type }); }}
                                                    style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '6px', background: '#f8f9fa', cursor: 'pointer', fontSize: '0.8rem' }}
                                                >✏️</button>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('¿Eliminar esta notificación?')) {
                                                            try { await api.delete(`/notifications/${n._id}`); fetchData(); } catch (err) { alert('Error al eliminar'); }
                                                        }
                                                    }}
                                                    style={{ padding: '6px 12px', border: '1px solid #ffcdd2', borderRadius: '6px', background: '#fff5f5', cursor: 'pointer', fontSize: '0.8rem', color: '#e53935' }}
                                                >🗑</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ============ MODAL: CONFIRMAR ELIMINACIÓN ============ */}
            {confirmDelete && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}
                    onClick={() => setConfirmDelete(null)}>
                    <div style={{
                        background: 'white', padding: '30px', borderRadius: '18px', width: '100%', maxWidth: '400px',
                        textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'fadeIn 0.2s'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%', background: '#fff5f5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 15px', fontSize: '1.8rem'
                        }}>⚠️</div>
                        <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>¿Eliminar {confirmDelete.type === 'product' ? 'producto' : 'pedido'}?</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '5px' }}>
                            <strong>{confirmDelete.name}</strong>
                        </p>
                        <p style={{ color: '#999', fontSize: '0.8rem', marginBottom: '25px' }}>
                            Esta acción no se puede deshacer.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', color: '#333' }}
                                onClick={() => setConfirmDelete(null)}
                            >Cancelar</button>
                            <button
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #e03131, #c92a2a)', color: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
                                onClick={executeDelete}
                            >Sí, eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
