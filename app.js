const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Message = require('./models/Message');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://gauravyadav9182:B9c28B2m5tMIUjDr@chat-room.tewqjwn.mongodb.net/?retryWrites=true&w=majority&appName=chat-room', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ MongoDB Error:', err));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// In-memory room list
let rooms = {}; // { roomCode: { adminId: socket.id, users: [] } }

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Room creation
  socket.on('create_room', ({ roomCode, username }) => {
    if (rooms[roomCode]) {
      socket.emit('room_exists');
      return;
    }

    rooms[roomCode] = {
      adminId: socket.id,
      users: [username],
    };

    socket.join(roomCode);
    socket.emit('room_created', { roomCode, isAdmin: true });
    console.log(`🚪 Room created: ${roomCode} by ${username}`);
  });

  // Room joining
  socket.on('join_room', async ({ roomCode, username }) => {
    if (!rooms[roomCode]) {
      socket.emit('room_not_found');
      return;
    }

    socket.join(roomCode);
    rooms[roomCode].users.push(username);

    // Send previous messages
    const messages = await Message.find({ room: roomCode });
    socket.emit('previous_messages', messages);

    socket.emit('joined_room', { isAdmin: false });
    console.log(`👥 ${username} joined room: ${roomCode}`);
  });

  // Send message
  socket.on('send_message', async ({ message, room, username }) => {
    const time = new Date().toLocaleTimeString();
    const msg = new Message({ room, username, message, time });
    await msg.save();
    io.to(room).emit('receive_message', { room, username, message, time });
  });

  // Admin deletes room
  socket.on('delete_room', async (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.adminId === socket.id) {
      await Message.deleteMany({ room: roomCode });
      delete rooms[roomCode];

      io.to(roomCode).emit('room_deleted');
      io.in(roomCode).socketsLeave(roomCode);
      console.log(`🗑️ Room deleted: ${roomCode}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    // Optional: cleanup logic for abandoned rooms
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
