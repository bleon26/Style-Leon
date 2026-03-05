const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const townRoutes = require('./routes/towns');
const carouselRoutes = require('./routes/carousel');
const notificationRoutes = require('./routes/notifications');
const Town = require('./models/Town');
const Carousel = require('./models/Carousel');

// DB Connection
mongoose.set('strictQuery', false);
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB Atlas');
    } catch (err) {
        console.error('❌ Error al conectar a MongoDB Atlas:', err.message);
        process.exit(1);
    }
};
connectDB();

mongoose.connection.on('error', err => {
    console.error('🔥 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/towns', townRoutes);
app.use('/api/carousel', carouselRoutes);
app.use('/api/notifications', notificationRoutes);

// Public stats endpoint (real data)
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
app.get('/api/stats', async (req, res) => {
    try {
        const [productsCount, usersCount, deliveredCount, ratingAgg] = await Promise.all([
            Product.countDocuments(),
            User.countDocuments(),
            Order.countDocuments({ status: 'Entregado' }),
            Product.aggregate([
                { $match: { rating: { $gt: 0 } } },
                { $group: { _id: null, avg: { $avg: '$rating' } } }
            ])
        ]);
        const result = {
            products: productsCount || 0,
            clients: usersCount || 0,
            rating: ratingAgg.length > 0 ? Math.round(ratingAgg[0].avg * 10) / 10 : 5.0,
            delivered: deliveredCount || 0
        };
        console.log('Stats response:', result);
        res.json(result);
    } catch (err) {
        console.error('Stats error:', err.message);
        res.status(200).json({ products: 0, clients: 0, rating: 5.0, delivered: 0 });
    }
});

// Seed default towns
const seedTowns = async () => {
    try {
        const count = await Town.countDocuments();
        if (count === 0) {
            await Town.insertMany([
                { name: 'Tecpatla' },
                { name: 'Patla' },
                { name: 'Chicontla' },
                { name: 'La Unión' }
            ]);
            console.log('🏘️ Pueblos iniciales creados');
        }
    } catch (err) {
        console.error('Error seeding towns:', err.message);
    }
};
seedTowns();

// Seed default carousel
const seedCarousel = async () => {
    try {
        const count = await Carousel.countDocuments();
        if (count === 0) {
            await Carousel.insertMany([
                {
                    image: '/hero_banner_1_1772126614973.png',
                    bgGradient: ['#1a1a2e', '#0f3460'],
                    tag: '✨ Nueva Colección 2026',
                    title: 'Moda que<br><span class="gradient-text">Te Define</span>',
                    description: 'Descubre las últimas tendencias en ropa, calzado y accesorios. Precios inigualables.',
                    buttons: [
                        { text: 'Comprar Ahora', action: 'scrollToProducts' },
                        { text: 'Ver Ofertas', action: 'scrollToSale' }
                    ],
                    showStats: true,
                    stats: [
                        { value: '10K+', label: 'Productos' },
                        { value: '50K+', label: 'Clientes' },
                        { value: '98%', label: 'Satisf.' }
                    ],
                    order: 0
                },
                {
                    image: '/product_sneakers_1772126728593.png',
                    bgGradient: ['#2d0036', '#9b00c9'],
                    tag: '🔥 Ofertas Limitadas',
                    title: 'Flash Sale<br><span style="color: #ffd700;">Hasta 70% OFF</span>',
                    description: 'Ofertas que desaparecen en horas. ¡No te quedes sin los mejores precios!',
                    buttons: [
                        { text: 'Ver Flash Sale', action: 'scrollToSale' }
                    ],
                    showTimer: true,
                    order: 1
                }
            ]);
            console.log('🖼️ Carrusel inicial creado');
        }
    } catch (err) {
        console.error('Error seeding carousel:', err.message);
    }
};
seedCarousel();

// Basic Route
app.get('/', (req, res) => {
    res.send('StyleShop API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error:', err.message, err.stack);
    res.status(500).json({ message: err.message || 'Algo salió mal en el servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
});
