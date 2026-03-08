const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { upload } = require('../config/cloudinary');

// Safe multer wrapper to catch errors
const safeUpload = (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Error de archivo: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

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

// Get my notifications (User)
router.get('/my', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort('-createdAt')
            .limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get unread count (User)
router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user.id, read: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark as read (User)
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Notificación no encontrada' });
        if (notification.user.toString() !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
        notification.read = true;
        await notification.save();
        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark all as read (User)
router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
        res.json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all notifications (Admin)
router.get('/all', protect, admin, async (req, res) => {
    try {
        const notifications = await Notification.find()
            .populate('user', 'name email')
            .sort('-createdAt')
            .limit(200);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create notification (Admin - send to specific user or all users)
router.post('/', protect, admin, safeUpload('image'), async (req, res) => {
    try {
        const { userId, title, message, type, sendToAll } = req.body;
        const image = req.file ? req.file.path : '';

        if (sendToAll === 'true' || sendToAll === true) {
            const users = await User.find({});
            const notifications = users.map(u => ({
                user: u._id,
                title,
                message,
                type: type || 'general',
                image
            }));
            await Notification.insertMany(notifications);
            res.status(201).json({ message: `Notificación enviada a ${users.length} usuarios` });
        } else {
            if (!userId) return res.status(400).json({ message: 'Se requiere userId o sendToAll' });
            const notification = new Notification({
                user: userId,
                title,
                message,
                type: type || 'general',
                image
            });
            await notification.save();
            res.status(201).json(notification);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update notification (Admin)
router.put('/:id', protect, admin, safeUpload('image'), async (req, res) => {
    try {
        const { title, message, type } = req.body;
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Notificación no encontrada' });
        if (title) notification.title = title;
        if (message) notification.message = message;
        if (type) notification.type = type;
        if (req.file) {
            notification.image = req.file.path;
        }
        await notification.save();
        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete notification (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notificación eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
