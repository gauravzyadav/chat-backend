const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const Message = require('./models/Message');
const Room = require('./models/Room');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://gauravyadav9182:B9c28B2m5tMIUjDr@chat-room.tewqjwn.mongodb.net/?retryWrites=true&w=majority&appName=chat-room')
.then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ MongoDB Error:', err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Create a room
  socket.on('create_room', async ({ roomCode, username }) => {
    const existingRoom = await Room.findOne({ code: roomCode });
    if (existingRoom) {
      socket.emit('room_exists');
      return;
    }

    const newRoom = new Room({
      code: roomCode,
      adminId: socket.id,
      adminName: username,
    });

    await newRoom.save();

    socket.join(roomCode);
    socket.emit('room_created', { roomCode, isAdmin: true });
    console.log(`🚪 Room created: ${roomCode} by ${username}`);
  });

  // Join an existing room
  socket.on('join_room', async ({ roomCode, username }) => {
    const room = await Room.findOne({ code: roomCode });
    if (!room) {
      socket.emit('room_not_found');
      return;
    }

    socket.join(roomCode);

    const messages = await Message.find({ room: roomCode });
    socket.emit('previous_messages', messages);

    const isAdmin = socket.id === room.adminId;
    socket.emit('joined_room', { isAdmin });
    console.log(`👥 ${username} joined room: ${roomCode}`);
  });

  // Send message to a room
  socket.on('send_message', async ({ message, room, username }) => {
    const time = new Date().toLocaleTimeString();
    const msg = new Message({ room, username, message, time });
    await msg.save();

    io.to(room).emit('receive_message', { room, username, message, time });
  });

  // Delete a room and its messages
  socket.on('delete_room', async (roomCode) => {
    const room = await Room.findOne({ code: roomCode });

    if (room && room.adminId === socket.id) {
      await Message.deleteMany({ room: roomCode });
      await Room.deleteOne({ code: roomCode });

      io.to(roomCode).emit('room_deleted');
      io.in(roomCode).socketsLeave(roomCode);

      console.log(`🗑️ Room deleted: ${roomCode}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
