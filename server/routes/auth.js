const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        await User.create(username, password);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findByUsername(username);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const valid = await User.validatePassword(user, password);
        if (!valid) return res.status(401).json({ error: 'Invalid password' });
        res.status(200).json({ message: 'Login successful', userId: user.id });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
