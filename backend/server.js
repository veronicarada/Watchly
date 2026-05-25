require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ],
    methods: ['GET', 'POST']
  }
});

// Guardar mensajes en memoria por sala (se borran cuando el server reinicia)
const roomMessages = {}

io.on('connection', (socket) => {
  socket.on('join-room', ({ code, username, silent }) => {
    socket.join(code)
    socket.data.username = username
    socket.data.room = code

    if (roomMessages[code]) {
      socket.emit('message-history', roomMessages[code])
    }

    if (!silent) {
      io.to(code).emit('user-joined', { username })
    }
  })

  // Rejoin silencioso para el popout: solo suscribe y manda historial, sin anunciar
  socket.on('rejoin-room', ({ code, username }) => {
    socket.join(code)
    socket.data.username = username
    socket.data.room = code
    const history = roomMessages[code] || []
    socket.emit('message-history', history)
  })

  socket.on('send-message', ({ code, username, text }) => {
    const msg = { username, text, time: new Date().toISOString() }
    if (!roomMessages[code]) roomMessages[code] = []
    roomMessages[code].push(msg)
    if (roomMessages[code].length > 100) roomMessages[code].shift()
    io.to(code).emit('new-message', msg)
  })

  socket.on('leave-room', ({ code, username }) => {
    socket.leave(code)
    io.to(code).emit('user-left', { username })
    if (roomMessages[code]) delete roomMessages[code]
  })

  socket.on('disconnect', () => {
    const { username, room } = socket.data
    if (room && username) {
      io.to(room).emit('user-left', { username })
    }
  })
})

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Demasiadas solicitudes, intentá en 15 minutos' }
});
app.use('/api/', limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./src/routes/auth'));
app.use('/api/movies',    require('./src/routes/movies'));
app.use('/api/favorites', require('./src/routes/favorites'));
app.use('/api/groups',    require('./src/routes/groups'));
app.use('/api/chatbot',   require('./src/routes/chatbot'));
app.use('/api/reviews',   require('./src/routes/reviews'));
app.use('/api/watched',   require('./src/routes/watched'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🎬 Watchly API is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

server.listen(PORT, () => {
  console.log(`\n🎬 Watchly Backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  console.log(`🔑 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});