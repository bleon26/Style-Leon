const express = require('express');
const Carousel = require('../models/Carousel');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'carousel_' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for carousel high-res images
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Solo se permiten imágenes (jpeg, jpg, png, webp)');
        }
    }
});

// Middleware to protect routes (Admin only)
const protectAdmin = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            if (decoded.isAdmin) {
                return next();
            } else {
                return res.status(401).json({ message: 'No autorizado como administrador' });
            }
        } catch (error) {
            return res.status(401).json({ message: 'No autorizado, token fallido' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'No hay token, no autorizado' });
    }
};

// Get all carousel slides
router.get('/', async (req, res) => {
    try {
        const slides = await Carousel.find().sort('order');
        res.json(slides);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new slide (Admin only)
router.post('/', protectAdmin, upload.single('image'), async (req, res) => {
    try {
        const {
            tag, title, description, bgGradient,
            buttons, showStats, stats, showTimer, order
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Por favor sube una imagen para el carrusel' });
        }

        const slide = new Carousel({
            image: `/uploads/${req.file.filename}`,
            tag,
            title,
            description,
            bgGradient: bgGradient ? JSON.parse(bgGradient) : ['#1a1a2e', '#0f3460'],
            buttons: buttons ? JSON.parse(buttons) : [],
            showStats: showStats === 'true' || showStats === true,
            stats: stats ? JSON.parse(stats) : [],
            showTimer: showTimer === 'true' || showTimer === true,
            order: order ? Number(order) : 0
        });

        await slide.save();
        res.status(201).json(slide);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a slide (Admin only)
router.put('/:id', protectAdmin, upload.single('image'), async (req, res) => {
    try {
        const slide = await Carousel.findById(req.params.id);
        if (!slide) return res.status(404).json({ message: 'Slide no encontrado' });

        const {
            tag, title, description, bgGradient,
            buttons, showStats, stats, showTimer, order
        } = req.body;

        if (tag !== undefined) slide.tag = tag;
        if (title !== undefined) slide.title = title;
        if (description !== undefined) slide.description = description;
        if (bgGradient) slide.bgGradient = JSON.parse(bgGradient);
        if (buttons) slide.buttons = JSON.parse(buttons);
        if (showStats !== undefined) slide.showStats = showStats === 'true' || showStats === true;
        if (stats) slide.stats = JSON.parse(stats);
        if (showTimer !== undefined) slide.showTimer = showTimer === 'true' || showTimer === true;
        if (order !== undefined) slide.order = Number(order);

        if (req.file) {
            slide.image = `/uploads/${req.file.filename}`;
        }

        await slide.save();
        res.json(slide);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a slide (Admin only)
router.delete('/:id', protectAdmin, async (req, res) => {
    try {
        const slide = await Carousel.findById(req.params.id);
        if (!slide) return res.status(404).json({ message: 'Slide no encontrado' });

        await Carousel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Slide eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
