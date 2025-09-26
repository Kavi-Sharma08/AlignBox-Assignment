const db = require('../config/db');

const Message = {
    create: async (roomId, userId, message) => {
        return db.promise().query('INSERT INTO messages (room_id, user_id, message) VALUES (?, ?, ?)', [roomId, userId, message]);
    },
    getByRoom: async (roomId) => {
        const [rows] = await db.promise().query('SELECT * FROM messages WHERE room_id = ?', [roomId]);
        return rows;
    }
};

module.exports = Message;
