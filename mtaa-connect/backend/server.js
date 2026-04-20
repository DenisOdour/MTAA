require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// ─── CORS Config ──────────────────────────────────────────────────
// Build list of allowed origins from env + known patterns
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_PROD,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    // Allow exact matches
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    // Allow ANY vercel.app subdomain (covers preview deploys too)
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    // Allow ANY render.com subdomain
    if (origin.endsWith('.onrender.com')) return callback(null, true);

    // Allow localhost on any port during development
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return callback(null, true);

    // Block everything else
    console.warn('CORS blocked origin:', origin);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some browsers (IE11) choke on 204
};

// ⚠️  Handle preflight OPTIONS requests FIRST — before any other middleware
app.options('*', cors(corsOptions));

// Apply CORS to all routes
app.use(cors(corsOptions));

// ─── Socket.io ────────────────────────────────────────────────────
const io = socketio(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      if (origin.endsWith('.onrender.com')) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      callback(null, true); // Socket.io: be more permissive for now
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

// ─── Security & Parsing ───────────────────────────────────────────
// Disable helmet's cross-origin restrictions since we handle CORS manually
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Rate limiting (generous for development)
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 200,
  message: { success: false, message: 'Too many requests. Please try again later.' }
}));

// ─── MongoDB Connection ───────────────────────────────────────────
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.includes('YOUR_USERNAME')) {
    console.error('\n❌ MONGO_URI not set in .env file!');
    console.error('   Copy .env.example to .env and add your MongoDB Atlas connection string.\n');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};
connectDB();

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/posts',         require('./routes/posts'));
app.use('/api/jobs',          require('./routes/jobs'));
app.use('/api/donations',     require('./routes/donations'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/businesses',    require('./routes/businesses'));
app.use('/api/skills',        require('./routes/skills'));
app.use('/api/safety',        require('./routes/safety'));
app.use('/api/emergency',     require('./routes/emergency'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/maps',          require('./routes/maps'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages',      require('./routes/messages'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Mtaa Connect API',
    version: '2.0.0',
    time: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ─── Socket.io Events ─────────────────────────────────────────────
const connectedUsers = {};

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    if (userId) {
      connectedUsers[userId] = socket.id;
      socket.join(userId);
      io.emit('users_online', Object.keys(connectedUsers).length);
    }
  });

  socket.on('join_admin', () => {
    socket.join('admins');
  });

  socket.on('emergency_alert', (data) => {
    io.emit('emergency_broadcast', { ...data, timestamp: new Date() });
  });

  socket.on('share_location', (data) => {
    if (data.userId) {
      socket.broadcast.emit('user_location_update', data);
      socket.to('admins').emit('user_location_update', data);
    }
  });

  socket.on('send_message', (data) => {
    if (data.recipientId) {
      io.to(data.recipientId).emit('new_message', data);
    }
  });

  socket.on('disconnect', () => {
    const userId = Object.keys(connectedUsers).find(k => connectedUsers[k] === socket.id);
    if (userId) delete connectedUsers[userId];
    io.emit('users_online', Object.keys(connectedUsers).length);
  });
});

// ─── Start Server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Mtaa Connect API running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n💡 Run "npm run seed" to create the admin account (denis254)\n`);
});

module.exports = { app, server };
