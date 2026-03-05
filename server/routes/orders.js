const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// Middleware to protect routes
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'No autorizado, token fallido' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'No hay token, no autorizado' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401).json({ message: 'No autorizado como administrador' });
    }
};

// Create Order (User)
router.post('/', protect, async (req, res) => {
    try {
        const { items, totalPrice, shippingAddress, phone, notes, customerName, customerEmail, customerPhone, customerTown, customerAddress, customerReference } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No hay productos en el pedido' });
        }

        const order = new Order({
            user: req.user.id,
            items,
            totalPrice,
            shippingAddress,
            phone: phone || customerPhone || '',
            notes: notes || '',
            customerName: customerName || '',
            customerEmail: customerEmail || '',
            customerPhone: customerPhone || '',
            customerTown: customerTown || '',
            customerAddress: customerAddress || '',
            customerReference: customerReference || ''
        });

        const createdOrder = await order.save();

        // Auto-create notification for the user
        try {
            await new Notification({
                user: req.user.id,
                title: '✅ Pedido Recibido',
                message: `¡Gracias por tu compra! Tu pedido #${createdOrder.orderNumber} ha sido recibido exitosamente. Puedes consultar el estatus de tu pedido en la sección "Mis Pedidos" desde tu perfil. Trabajamos para brindarte la mejor experiencia de compra.`,
                type: 'order',
                orderId: createdOrder._id
            }).save();
        } catch (notifErr) {
            console.error('Error creating notification:', notifErr.message);
        }

        res.status(201).json(createdOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get My Orders (User)
router.get('/my', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Orders (Admin)
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'name email').sort('-createdAt');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Order Status (Admin)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { status, deliveryStart, deliveryEnd, deliveredAt } = req.body;
        const order = await Order.findById(req.params.id);

        if (order) {
            order.status = status || order.status;
            if (deliveryStart && deliveryEnd) {
                order.deliveryRange = {
                    start: new Date(deliveryStart),
                    end: new Date(deliveryEnd)
                };
            }
            if (deliveredAt) {
                order.deliveredAt = new Date(deliveredAt);
            }
            const updatedOrder = await order.save();

            // Auto-notify user about status change
            try {
                const statusMessages = {
                    'Procesando': `Tu pedido #${order.orderNumber} está siendo procesado. Te notificaremos cuando esté en camino.`,
                    'Enviado': `¡Tu pedido #${order.orderNumber} ha sido enviado! Pronto lo recibirás en la dirección indicada.`,
                    'Entregado': `Tu pedido #${order.orderNumber} ha sido entregado. ¡Esperamos que disfrutes tu compra! Puedes dejar una reseña en la sección "Mis Pedidos".`,
                    'Cancelado': `Tu pedido #${order.orderNumber} ha sido cancelado. Si tienes dudas, contáctanos para mayor información.`
                };
                if (status && statusMessages[status]) {
                    await new Notification({
                        user: order.user,
                        title: `📦 Pedido ${status}`,
                        message: statusMessages[status],
                        type: 'status',
                        orderId: order._id
                    }).save();
                }
            } catch (notifErr) {
                console.error('Error creating status notification:', notifErr.message);
            }

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Pedido no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add Review (User - only for delivered orders)
router.post('/:id/review', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
        if (order.user.toString() !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
        if (order.status !== 'Entregado') return res.status(400).json({ message: 'Solo puedes reseñar pedidos entregados' });
        if (order.review?.rating) return res.status(400).json({ message: 'Ya dejaste una reseña para este pedido' });

        order.review = {
            rating: Number(rating),
            comment: comment || '',
            reviewedAt: new Date()
        };
        const updatedOrder = await order.save();

        // Update product ratings for each item in the order
        for (const item of order.items) {
            if (!item._id) continue;
            // Find all reviewed orders that contain this product
            const reviewedOrders = await Order.find({
                'items._id': item._id,
                'review.rating': { $exists: true, $ne: null }
            });
            if (reviewedOrders.length > 0) {
                const totalRating = reviewedOrders.reduce((sum, o) => sum + o.review.rating, 0);
                const avgRating = Math.round((totalRating / reviewedOrders.length) * 10) / 10;
                await Product.findByIdAndUpdate(item._id, {
                    rating: avgRating,
                    reviewsCount: reviewedOrders.length
                });
            }
        }

        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Order (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            await Order.findByIdAndDelete(req.params.id);
            res.json({ message: 'Pedido eliminado correctamente' });
        } else {
            res.status(404).json({ message: 'Pedido no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
