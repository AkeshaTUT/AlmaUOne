const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active rooms and their participants
const rooms = new Map();

// Debug middleware for all events
io.use((socket, next) => {
  socket.onAny((event, ...args) => {
    console.log(`[SERVER] Event ${event} from ${socket.id}:`, args);
  });
  next();
});

io.on('connection', (socket) => {
  console.log('[SERVER] Client connected:', socket.id);

  // Handle room joining
  socket.on('join-room', (roomId, userId) => {
    console.log(`[SERVER] join-room: user ${userId} (${socket.id}) joining room ${roomId}`);
    
    // Log current room state
    console.log('[SERVER] Current rooms:', Array.from(rooms.entries()).map(([room, users]) => ({
      room,
      users: Array.from(users)
    })));
    
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(userId);

    // Log room participants after join
    console.log(`[SERVER] Room ${roomId} participants:`, Array.from(rooms.get(roomId)));

    // Notify others in the room
    socket.to(roomId).emit('user-joined', userId);
  });

  // Handle WebRTC signaling
  socket.on('offer', (offer, roomId, userId) => {
    console.log(`[SERVER] offer from ${userId} in room ${roomId}`);
    console.log('[SERVER] Room participants:', Array.from(rooms.get(roomId) || []));
    socket.to(roomId).emit('offer', offer, userId);
  });

  socket.on('answer', (answer, roomId, userId) => {
    console.log(`[SERVER] answer from ${userId} in room ${roomId}`);
    console.log('[SERVER] Room participants:', Array.from(rooms.get(roomId) || []));
    socket.to(roomId).emit('answer', answer, userId);
  });

  socket.on('ice-candidate', (candidate, roomId, userId) => {
    console.log(`[SERVER] ice-candidate from ${userId} in room ${roomId}`);
    console.log('[SERVER] Room participants:', Array.from(rooms.get(roomId) || []));
    socket.to(roomId).emit('ice-candidate', candidate, userId);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[SERVER] disconnect: ${socket.id}`);
    
    // Clean up rooms
    rooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        console.log(`[SERVER] Removing ${socket.id} from room ${roomId}`);
        participants.delete(socket.id);
        if (participants.size === 0) {
          console.log(`[SERVER] Removing empty room ${roomId}`);
          rooms.delete(roomId);
        } else {
          console.log(`[SERVER] Notifying room ${roomId} about user left`);
          socket.to(roomId).emit('user-left', socket.id);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[SERVER] Server running on port ${PORT}`);
}); 