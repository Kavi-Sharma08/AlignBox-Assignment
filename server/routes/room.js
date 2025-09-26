const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

function generateRoomId() {
    return Math.random().toString(36).substr(2, 9);
}

router.post('/create', async (req, res) => {
    const { creatorId } = req.body;
    const roomId = generateRoomId();
    try {
        await Room.create(roomId, creatorId);
        res.status(201).json({ roomId });
    } catch (err) {
        res.status(500).json({ error: 'Room creation failed' });
    }
});

router.post('/join', async (req, res) => {
    const { roomId } = req.body;
    try {
        const room = await Room.findById(roomId);
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.status(200).json({ message: 'Joined room', roomId });
    } catch (err) {
        res.status(500).json({ error: 'Join failed' });
    }
});

module.exports = router;
