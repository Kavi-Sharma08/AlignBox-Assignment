const db = require('../config/db');

const Room = {
    create: async (roomId, creatorId) => {
        return db.promise().query('INSERT INTO rooms (room_id, creator_id) VALUES (?, ?)', [roomId, creatorId]);
    },
    findById: async (roomId) => {
        const [rows] = await db.promise().query('SELECT * FROM rooms WHERE room_id = ?', [roomId]);
        return rows[0];
    }
};

module.exports = Room;
