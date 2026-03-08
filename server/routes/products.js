const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

const jwt = require('jsonwebtoken');
const { upload } = require('../config/cloudinary');

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

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort('-createdAt');
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create product (Admin only)
router.post('/', protectAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const { name, category, price, originalPrice, description, colors, sizes, isNewProduct, isSale } = req.body;

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => file.path);
        }

        const product = new Product({
            name,
            category,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            description,
            image: imageUrls[0] || '', // Use first image as main
            images: imageUrls,
            colors: colors ? colors.split(',') : [],
            sizes: sizes ? sizes.split(',') : [],
            isNewProduct: isNewProduct === 'true' || isNewProduct === true,
            isSale: isSale === 'true' || isSale === true
        });

        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete product (Admin only)
router.delete('/:id', protectAdmin, async (req, res) => {
    try {
        console.log('Deleting product:', req.params.id);
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        await Product.findByIdAndDelete(req.params.id);
        console.log('Product deleted successfully:', req.params.id);
        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        console.error('Error deleting product:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// Update product (Admin only)
router.put('/:id', protectAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

        const { name, category, price, originalPrice, description, sizes, isSale } = req.body;

        if (name) product.name = name;
        if (category) product.category = category;
        if (price) product.price = Number(price);
        if (originalPrice !== undefined) product.originalPrice = originalPrice ? Number(originalPrice) : undefined;
        if (description !== undefined) product.description = description;
        if (sizes !== undefined) product.sizes = sizes ? sizes.split(',').map(s => s.trim()) : [];
        if (isSale !== undefined) product.isSale = isSale === 'true' || isSale === true;

        // If new images were uploaded, replace the old ones
        if (req.files && req.files.length > 0) {
            const imageUrls = req.files.map(file => file.path);
            product.image = imageUrls[0];
            product.images = imageUrls;
        }

        await product.save();
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
