const express = require('express');
const router = express.Router();
const Town = require('../models/Town');
const jwt = require('jsonwebtoken');

// Admin middleware
const protectAdmin = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.isAdmin) {
                req.user = decoded;
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

// Get all active towns (Public)
router.get('/', async (req, res) => {
    try {
        const towns = await Town.find({ isActive: true }).sort('name');
        res.json(towns);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a town (Admin only)
router.post('/', protectAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre del pueblo es requerido' });
        }

        const exists = await Town.findOne({ name: name.trim() });
        if (exists) {
            return res.status(400).json({ message: 'Este pueblo ya existe' });
        }

        const town = new Town({ name: name.trim() });
        await town.save();
        res.status(201).json(town);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a town (Admin only)
router.delete('/:id', protectAdmin, async (req, res) => {
    try {
        await Town.findByIdAndDelete(req.params.id);
        res.json({ message: 'Pueblo eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
