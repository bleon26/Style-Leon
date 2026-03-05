import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import QuickViewModal from '../components/QuickViewModal';
import api from '../api';

// Animated counter component
const AnimatedStat = ({ end, suffix, label, icon, decimal }) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const isVisible = useRef(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { isVisible.current = entry.isIntersecting; },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (hasAnimated || !end || end <= 0) return;
        const tryAnimate = () => {
            if (!isVisible.current) return;
            setHasAnimated(true);
            const duration = 2000;
            const steps = 60;
            const increment = end / steps;
            let current = 0;
            const timer = setInterval(() => {
                current += increment;
                if (current >= end) {
                    setCount(end);
                    clearInterval(timer);
                } else {
                    setCount(decimal ? Math.round(current * 10) / 10 : Math.floor(current));
                }
            }, duration / steps);
        };
        // Try immediately, then retry every 200ms until visible
        if (isVisible.current) { tryAnimate(); }
        else { const check = setInterval(() => { if (isVisible.current) { clearInterval(check); tryAnimate(); } }, 200); return () => clearInterval(check); }
    }, [end, hasAnimated, decimal]);

    return (
        <div ref={ref} className="stat-item" style={{ padding: '10px' }}>
            <div className="stat-icon" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{icon}</div>
            <div className="stat-number" style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: 'white',
                lineHeight: 1,
                marginBottom: '8px',
                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                {decimal ? count.toFixed(1) : count.toLocaleString()}{suffix}
            </div>
            <div className="stat-label" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>{label}</div>
        </div>
    );
};

// Simple fuzzy match: checks if all characters of query appear in text in order
const fuzzyMatch = (text, query) => {
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    let ti = 0;
    for (let qi = 0; qi < q.length; qi++) {
        const idx = t.indexOf(q[qi], ti);
        if (idx === -1) return false;
        ti = idx + 1;
    }
    return true;
};

// Score how well a product matches the query (higher = better match)
const matchScore = (product, query) => {
    const q = query.toLowerCase().trim();
    const name = product.name.toLowerCase();
    const cat = product.category.toLowerCase();
    const desc = (product.description || '').toLowerCase();

    // Exact match in name = best
    if (name.includes(q)) return 100;
    // Category match
    if (cat.includes(q)) return 80;
    // Description match
    if (desc.includes(q)) return 60;
    // Fuzzy match on name
    if (fuzzyMatch(name, q)) return 40;
    // Fuzzy match on description
    if (fuzzyMatch(desc, q)) return 20;

    return 0;
};

const Home = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const lastCategoryRef = useRef('all');
    const [stats, setStats] = useState({ products: 0, clients: 0, rating: 5.0, delivered: 0 });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                setProducts(res.data);
                setFilteredProducts(res.data);
            } catch (err) {
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
        // Fetch real stats
        api.get('/stats').then(res => {
            console.log('Stats loaded:', res.data);
            setStats(res.data);
        }).catch(err => console.error('Stats fetch error:', err.message));
    }, []);

    useEffect(() => {
        let result = products;

        // Category Filter
        if (category === 'sale') {
            result = result.filter(p => p.isSale);
        } else if (category !== 'all') {
            result = result.filter(p => p.category.toLowerCase() === category);
        }

        // Search Filter with fuzzy matching
        if (searchQuery && searchQuery.trim().length > 0) {
            const q = searchQuery.trim();
            const scored = result
                .map(p => ({ product: p, score: matchScore(p, q) }))
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score);
            result = scored.map(item => item.product);
        }

        setFilteredProducts(result);
    }, [category, searchQuery, products]);

    // Scroll to products only on category change
    useEffect(() => {
        if (category !== lastCategoryRef.current) {
            lastCategoryRef.current = category;
            if (category !== 'all') {
                setTimeout(() => {
                    document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [category]);

    const handleAction = (action) => {
        if (action === 'scrollToProducts') {
            document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
        } else if (action === 'scrollToSale') {
            setCategory('sale');
            document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleSearchSubmit = () => {
        if (searchQuery.trim().length > 0) {
            document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <main className="main-content">
            <Navbar
                onSearch={handleSearch}
                onSearchSubmit={handleSearchSubmit}
                onCategoryChange={setCategory}
                currentCategory={category}
            />

            <HeroSlider onAction={handleAction} />

            <section className="section product-section" id="productsSection">
                <div className="container">
                    <div className="products-header">
                        <h2 className="section-title">
                            {searchQuery ? `Resultados para "${searchQuery}"` :
                                category === 'all' ? 'Nuestra Colección' :
                                    category === 'sale' ? 'Ofertas Especiales' :
                                        `Colección de ${category.charAt(0).toUpperCase() + category.slice(1)}`}
                        </h2>
                        <div className="filter-sort-wrap">
                            <div className="filter-chips">
                                {['all', 'mujer', 'hombre', 'calzado', 'accesorios', 'sale'].map(cat => (
                                    <button
                                        key={cat}
                                        className={`chip ${category === cat ? 'active' : ''}`}
                                        onClick={() => { setCategory(cat); setSearchQuery(''); }}
                                    >
                                        {cat === 'all' ? 'Todo' : cat === 'sale' ? 'En Oferta' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '100px', textAlign: 'center' }}>
                            <div className="loader"></div>
                            <p>Cargando productos...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="no-results" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px' }}>
                            <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>🔍</span>
                            <h3>No encontramos lo que buscas</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                {searchQuery
                                    ? `No hay productos que coincidan con "${searchQuery}". Prueba con otro término.`
                                    : 'Prueba con otros filtros o términos de búsqueda.'}
                            </p>
                            <button className="btn-primary" onClick={() => { setCategory('all'); setSearchQuery(''); }}>Limpiar Filtros</button>
                        </div>
                    ) : (
                        <div className="product-grid">
                            {filteredProducts.map(p => (
                                <ProductCard
                                    key={p._id}
                                    product={p}
                                    onQuickView={(prod) => setSelectedProduct(prod)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <QuickViewModal
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
            {/* Benefits Section */}
            <section style={{ padding: '30px 0 20px' }}>
                <div className="container">
                    <style>{`
                        .benefits-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
                        .stats-box { padding: 40px 20px; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                        .stat-number { font-size: 2.5rem; }
                        .stat-icon { font-size: 1.8rem; }
                        @media (max-width: 768px) {
                            .benefits-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
                            .benefits-grid .benefit-card { padding: 12px 14px !important; gap: 10px !important; }
                            .benefits-grid .benefit-card h3 { font-size: 0.85rem !important; }
                            .benefits-grid .benefit-card p { font-size: 0.72rem !important; }
                            .benefits-grid .benefit-icon { font-size: 1.2rem !important; }
                            .benefits-title { font-size: 1.3rem !important; margin-bottom: 16px !important; }
                            .stats-box { padding: 25px 15px !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; border-radius: 14px !important; }
                            .stat-number { font-size: 1.6rem !important; }
                            .stat-icon { font-size: 1.3rem !important; margin-bottom: 4px !important; }
                            .stat-label { font-size: 0.75rem !important; }
                            .stat-item { padding: 5px !important; }
                        }
                    `}</style>
                    <h2 className="benefits-title" style={{ textAlign: 'center', marginBottom: '25px', fontSize: '1.8rem', fontWeight: '700' }}>¿Por qué comprar con nosotros?</h2>
                    <div className="benefits-grid">
                        {[
                            { icon: '🚚', title: 'Envío Gratis', desc: 'En pedidos +$299', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
                            { icon: '🔒', title: 'Pago 100% Seguro', desc: 'Tu información protegida', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
                            { icon: '✅', title: 'Calidad Garantizada', desc: 'Productos seleccionados', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
                            { icon: '📦', title: 'Entrega Rápida', desc: 'Recibe tu pedido pronto', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' }
                        ].map((b, i) => (
                            <div key={i} className="benefit-card" style={{
                                background: b.gradient,
                                borderRadius: '14px',
                                padding: '16px 20px',
                                color: 'white',
                                cursor: 'default',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px'
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'; }}
                            >
                                <span className="benefit-icon" style={{ fontSize: '1.5rem', flexShrink: 0 }}>{b.icon}</span>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 2px 0' }}>{b.title}</h3>
                                    <p style={{ fontSize: '0.82rem', margin: 0, opacity: 0.85 }}>{b.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Animated Stats Counter Section */}
            <section style={{ padding: '20px 0 50px' }}>
                <div className="container">
                    <div className="stats-box" style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                        borderRadius: '20px',
                        padding: '40px 20px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '20px',
                        textAlign: 'center',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
                        {[
                            { end: stats.products, suffix: '+', label: 'Productos', icon: '🛍️' },
                            { end: stats.clients, suffix: '+', label: 'Clientes Satisfechos', icon: '😊' },
                            { end: stats.rating, suffix: '★', label: 'Calificación Promedio', icon: '⭐', decimal: true },
                            { end: stats.delivered, suffix: '+', label: 'Pedidos Entregados', icon: '📦' }
                        ].map((stat, i) => (
                            <AnimatedStat key={`${i}-${stat.end}`} {...stat} />
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Home;
