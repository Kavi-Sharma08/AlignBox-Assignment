const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

router.post('/send', async (req, res) => {
    const { roomId, userId, message } = req.body;
    try {
        await Message.create(roomId, userId, message);
        res.status(201).json({ message: 'Message sent' });
    } catch (err) {
        res.status(500).json({ error: 'Send failed' });
    }
});

router.get('/:roomId', async (req, res) => {
    const { roomId } = req.params;
    try {
        const messages = await Message.getByRoom(roomId);
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

module.exports = router;
