const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');
const messageRoutes = require('./routes/message');

const app = express();
app.use(express.static(require('path').join(__dirname, '../public')));
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/message', messageRoutes);

const rooms = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomId, username }) => {
        socket.join(roomId);
        socket.to(roomId).emit('userJoined', `${username} joined the room.`);
    });

    socket.on('sendMessage', ({ roomId, username, message }) => {
        io.to(roomId).emit('receiveMessage', { username, message });
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
