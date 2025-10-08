import type { Request, Response } from 'express';
import { db } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import { JoinRoomSchema } from './schema.js';


function genRoomCode(len = 6) {
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let out = '';
for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
return out;
}


export function createRoom(req: Request, res: Response) {
// @ts-ignore
const userId = req.userId as string;
let code = '';
do {
code = genRoomCode(6);
} while (db.prepare('SELECT 1 FROM rooms WHERE code = ?').get(code));
const created_at = Date.now();
db.prepare('INSERT INTO rooms (code, host_user_id, created_at, is_active) VALUES (?, ?, ?, 1)')
.run(code, userId, created_at);
return res.json({ code });
}


export function getRoom(req: Request, res: Response) {
const { code } = req.params;
const room = db.prepare('SELECT * FROM rooms WHERE code = ?').get(code);
if (!room) return res.status(404).json({ error: 'Room not found' });
const participants = db.prepare('SELECT id, display_name, score, selfie_url FROM participants WHERE room_code = ? ORDER BY score DESC, created_at ASC').all(code);
return res.json({ room, participants });
}


export function joinRoom(req: Request, res: Response) {
const { code } = req.params;
const room = db.prepare('SELECT * FROM rooms WHERE code = ? AND is_active = 1').get(code);
if (!room) return res.status(404).json({ error: 'Room not found or inactive' });
const parsed = JoinRoomSchema.safeParse(req.body);
if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });


// @ts-ignore
const userId = req.userId as string;
const { displayName } = parsed.data;
const exists = db.prepare('SELECT id FROM participants WHERE room_code = ? AND user_id = ?').get(code, userId);
if (exists) return res.json({ participantId: (exists as any).id });


const id = uuidv4();
const created_at = Date.now();
db.prepare('INSERT INTO participants (id, room_code, user_id, display_name, score, created_at) VALUES (?, ?, ?, ?, 0, ?)')
.run(id, code, userId, displayName, created_at);
return res.json({ participantId: id });
}


export function leaderboard(req: Request, res: Response) {
const { code } = req.params;
const rows = db.prepare('SELECT display_name, score FROM participants WHERE room_code = ? ORDER BY score DESC, created_at ASC').all(code);
return res.json({ leaderboard: rows });
}