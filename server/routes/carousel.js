const express = require('express');
const Carousel = require('../models/Carousel');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { upload, deleteImageByUrl } = require('../config/cloudinary');

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
            image: req.file.path,
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
            if (slide.image) {
                await deleteImageByUrl(slide.image);
            }
            slide.image = req.file.path;
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

        if (slide.image) {
            await deleteImageByUrl(slide.image);
        }

        await Carousel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Slide eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
