const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'El usuario ya existe' });

        const userCount = await User.countDocuments();
        const user = new User({
            name,
            email,
            password,
            isAdmin: userCount === 0
        });
        await user.save();

        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { name: user.name, email: user.email, isAdmin: user.isAdmin } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.name, email: user.email, isAdmin: user.isAdmin } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Google Auth
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;

        // Very basic simple verify without enforcing specific CLIENT_ID to avoid setup issues if possible
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { email, name, picture } = ticket.getPayload();

        let user = await User.findOne({ email });
        if (!user) {
            const userCount = await User.countDocuments();
            // Create user with a random unguessable password
            const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);

            user = new User({
                name,
                email,
                password: randomPassword,
                isAdmin: userCount === 0
            });
            await user.save();
        }

        const jwtToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: jwtToken, user: { name: user.name, email: user.email, isAdmin: user.isAdmin, picture } });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(400).json({ message: 'Error en autenticación de Google' });
    }
});

// Forgot Password (Mock Token Generation)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const token = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetToken = token;
        await user.save();

        res.json({ message: 'Código enviado', token }); // In production, don't return the token in response
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        const user = await User.findOne({ email, resetToken: token });
        if (!user) return res.status(400).json({ message: 'Código inválido o expirado' });

        user.password = newPassword;
        user.resetToken = undefined;
        await user.save();

        res.json({ message: 'Contraseña actualizada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Get all users (Admin only)
router.get('/users', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'No autorizado' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) return res.status(403).json({ message: 'Solo administradores' });

        const users = await User.find().select('name email password isAdmin createdAt').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
