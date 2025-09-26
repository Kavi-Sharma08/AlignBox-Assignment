const db = require('../config/db');
const bcrypt = require('bcrypt');

const User = {
    create: async (username, password) => {
        const hash = await bcrypt.hash(password, 10);
        return db.promise().query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
    },
    findByUsername: async (username) => {
        const [rows] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    },
    validatePassword: async (user, password) => {
        return bcrypt.compare(password, user.password);
    }
};

module.exports = User;
