import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';


import { register, login, me, authMiddleware } from './auth.js';
import { createRoom, getRoom, joinRoom, leaderboard } from './rooms.js';
import { uploadAvatar, handleUploadAvatar } from './userdata.js'
import { uploadDrink, uploadSelfie, handleUploadDrink, handleUploadSelfie } from './uploads.js';
import { makeScoreHandler } from './scoring.js';
import { startCleanupJob } from './cleanup.js';


const app = express();
const httpServer = createServer(app);
const io = new IOServer(httpServer, { cors: { origin: process.env.CORS_ORIGIN?.split(',') || '*' } });


// Security & middlewares
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({ origin: (process.env.CORS_ORIGIN || '*').split(','), credentials: true }));


const limiter = rateLimit({ windowMs: 60_000, max: 120 });
app.use('/api/', limiter);


// Static uploads & SPA
const uploadsDir = process.env.UPLOADS_DIR || path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));
const publicDir = path.resolve(process.cwd(), 'backend', 'dist', 'public');
app.use(express.static(publicDir));

// Avatar upload
app.post('/api/user/avatar', authMiddleware, (req, res) =>
  uploadAvatar(req, res, err =>
    err ? res.status(400).json({ error: err.message }) : handleUploadAvatar(req, res)
  )
)
app.use('/userdata', express.static(path.resolve(process.cwd(), 'userdata')))

// Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authMiddleware, me);


app.post('/api/rooms', authMiddleware, createRoom);
app.get('/api/rooms/:code', getRoom);
app.post('/api/rooms/:code/join', authMiddleware, joinRoom);


app.post('/api/rooms/:code/upload-drink', authMiddleware, (req, res) => uploadDrink(req, res, err => err ? res.status(400).json({ error: err.message }) : handleUploadDrink(req, res)));
app.post('/api/rooms/:code/upload-selfie', authMiddleware, (req, res) => uploadSelfie(req, res, err => err ? res.status(400).json({ error: err.message }) : handleUploadSelfie(req, res)));


app.get('/api/rooms/:code/leaderboard', leaderboard);
app.post('/api/rooms/:code/score', authMiddleware, makeScoreHandler(io));


// Socket.IO
io.on('connection', socket => {
socket.on('room:join', ({ code }) => {
if (typeof code === 'string' && code.length >= 4) {
socket.join(code);
}
});
});


// Fallback to SPA
app.get('*', (_req, res) => {
res.sendFile(path.join(publicDir, 'index.html'));
});


// Start background jobs
startCleanupJob();

const PORT = parseInt(process.env.PORT || '8080', 10);
httpServer.listen(PORT, () => {
console.log(`Buzzed API listening on http://localhost:${PORT}`);
});