require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── State ──────────────────────────────────────────────────────────────────
const rooms = {}; // roomId → { players: {}, chatHistory: [] }

function getOrCreateRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = { players: {}, chatHistory: [] };
  }
  return rooms[roomId];
}

// ── Proximity helpers ──────────────────────────────────────────────────────
const PROXIMITY_THRESHOLD = 80; // pixels

function getDistance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function getNearbyPlayers(room, playerId) {
  const me = room.players[playerId];
  if (!me) return [];
  return Object.entries(room.players)
    .filter(([id, p]) => id !== playerId && getDistance(me, p) < PROXIMITY_THRESHOLD)
    .map(([id]) => id);
}

// ── Socket events ──────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);
  let currentRoom = null;

  // ── Join room ──────────────────────────────────────────────────────────
  socket.on('join-room', ({ roomId, playerData }) => {
    currentRoom = roomId;
    const room = getOrCreateRoom(roomId);

    room.players[socket.id] = {
      id: socket.id,
      x: playerData.x || 400,
      y: playerData.y || 300,
      name: playerData.name || `Player_${socket.id.slice(0, 4)}`,
      avatar: playerData.avatar || 0,
      direction: 'down',
      isMoving: false,
    };

    socket.join(roomId);

    // Send current state to joining player
    socket.emit('room-state', {
      players: room.players,
      chatHistory: room.chatHistory.slice(-50),
    });

    // Notify others
    socket.to(roomId).emit('player-joined', room.players[socket.id]);

    console.log(`[join] ${socket.id} → room:${roomId} (${Object.keys(room.players).length} players)`);
  });

  // ── Player movement ────────────────────────────────────────────────────
  socket.on('player-move', (data) => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room || !room.players[socket.id]) return;

    Object.assign(room.players[socket.id], {
      x: data.x,
      y: data.y,
      direction: data.direction,
      isMoving: data.isMoving,
    });

    socket.to(currentRoom).emit('player-moved', {
      id: socket.id,
      x: data.x,
      y: data.y,
      direction: data.direction,
      isMoving: data.isMoving,
    });

    // Check proximity and emit to both players
    const nearby = getNearbyPlayers(room, socket.id);
    socket.emit('proximity-update', { nearby });
  });

  // ── Chat ───────────────────────────────────────────────────────────────
  socket.on('chat-message', ({ roomId, message }) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];
    const player = room.players[socket.id];
    if (!player) return;

    const msg = {
      id: `${Date.now()}-${socket.id}`,
      senderId: socket.id,
      senderName: player.name,
      text: message,
      timestamp: Date.now(),
    };

    room.chatHistory.push(msg);
    if (room.chatHistory.length > 200) room.chatHistory.shift();

    io.to(currentRoom).emit('chat-message', msg);
  });

  // ── WebRTC signalling ──────────────────────────────────────────────────
  socket.on('rtc-offer', ({ targetId, offer }) => {
    io.to(targetId).emit('rtc-offer', { fromId: socket.id, offer });
  });

  socket.on('rtc-answer', ({ targetId, answer }) => {
    io.to(targetId).emit('rtc-answer', { fromId: socket.id, answer });
  });

  socket.on('rtc-ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('rtc-ice-candidate', { fromId: socket.id, candidate });
  });

  socket.on('call-ended', ({ targetId }) => {
    io.to(targetId).emit('call-ended', { fromId: socket.id });
  });

  // ── Disconnect ─────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (currentRoom && rooms[currentRoom]) {
      delete rooms[currentRoom].players[socket.id];
      io.to(currentRoom).emit('player-left', socket.id);
      if (Object.keys(rooms[currentRoom].players).length === 0) {
        delete rooms[currentRoom];
      }
    }
    console.log(`[disconnect] ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
