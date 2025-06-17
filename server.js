const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config({ path: '.hh.env' });
require('dotenv').config({ path: '.coursera.env' });

const app = express();
app.use(cors());

// HH.ru API configuration
const HH_ACCESS_TOKEN = process.env.HH_ACCESS_TOKEN;
const HH_REFRESH_TOKEN = process.env.HH_REFRESH_TOKEN;
const HH_TOKEN_TYPE = process.env.HH_TOKEN_TYPE;
const HH_USER_AGENT = 'AlmaUOne/1.0 (akezhseitkasym@gmail.com)';

// Coursera API config
const COURSERA_API_KEY = process.env.COURSERA_API_KEY;
const COURSERA_API_SECRET = process.env.COURSERA_API_SECRET;
const COURSERA_API_BASE_URL = process.env.COURSERA_API_BASE_URL;
const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE || 'ru';
const DEFAULT_LIMIT = process.env.DEFAULT_LIMIT || 20;
const DEFAULT_LEVEL = process.env.DEFAULT_LEVEL || 'beginner';
const CACHE_DURATION = process.env.CACHE_DURATION || 3600;
const courseraCache = new Map();

if (!HH_ACCESS_TOKEN) {
  console.error('Error: HH.ru API credentials are not set in .hh.env');
  process.exit(1);
}

// Универсальный fetch для Node.js
const fetch = global.fetch || ((...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)));

// HH.ru API endpoint for vacancy search
app.get('/api/hh', async (req, res) => {
  try {
    const response = await fetch(`https://api.hh.ru/vacancies?${new URLSearchParams(req.query)}`, {
      headers: {
        'Authorization': `Bearer ${HH_ACCESS_TOKEN}`,
        'HH-User-Agent': HH_USER_AGENT
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HH.ru API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'HH.ru API error', 
        status: response.status,
        details: errorText 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('Server error:', e);
    res.status(500).json({ 
      error: 'Server error', 
      details: e.message 
    });
  }
});

// HH.ru API endpoint for vacancy details
app.get('/api/hh/vacancies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    const response = await fetch(`https://api.hh.ru/vacancies/${id}`, {
      headers: {
        'Authorization': `Bearer ${HH_ACCESS_TOKEN}`,
        'HH-User-Agent': HH_USER_AGENT
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HH.ru API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'HH.ru API error', 
        status: response.status,
        details: errorText 
      });
    }

    const vacancy = await response.json();
    res.json(vacancy);
  } catch (e) {
    console.error('Server error:', e);
    res.status(500).json({ 
      error: 'Server error', 
      details: e.message 
    });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const cacheKey = JSON.stringify(req.query);
    const cachedData = courseraCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION * 1000) {
      return res.json(cachedData.data);
    }
    const params = new URLSearchParams();
    params.set('q', 'search');
    if (req.query.q) params.set('query', req.query.q);
    params.set('limit', req.query.limit || DEFAULT_LIMIT);
    params.set('language', req.query.language || DEFAULT_LANGUAGE);
    params.set('level', req.query.level || DEFAULT_LEVEL);
    if (req.query.category) params.set('category', req.query.category);
    const auth = Buffer.from(`${COURSERA_API_KEY}:${COURSERA_API_SECRET}`).toString('base64');
    const url = `${COURSERA_API_BASE_URL}?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'Coursera API error', status: response.status, details: errorText });
    }
    const data = await response.json();
    const transformedData = {
      elements: data.elements.map(course => ({
        id: course.id,
        name: course.name,
        description: course.description,
        instructorName: course.instructorName || 'Coursera Instructor',
        rating: course.rating || 0,
        numReviews: course.numReviews || 0,
        enrolledCount: course.enrolledCount || 0,
        duration: course.duration || course.estimatedEffort || '',
        level: course.level || DEFAULT_LEVEL,
        category: course.category,
        photoUrl: course.photoUrl || 'https://example.com/default-course.jpg',
        url: course.url,
        price: course.price || 0,
        language: course.language || DEFAULT_LANGUAGE,
        skills: course.skills || []
      }))
    };
    courseraCache.set(cacheKey, { data: transformedData, timestamp: Date.now() });
    res.json(transformedData);
  } catch (e) {
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

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