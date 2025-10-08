import type { Request, Response } from 'express';
import { db } from './db.js';
import { ScoreSchema } from './schema.js';
import { v4 as uuidv4 } from 'uuid';
import type { Server as IOServer } from 'socket.io';


export function makeScoreHandler(io: IOServer) {
return function score(req: Request, res: Response) {
const parsed = ScoreSchema.safeParse(req.body);
if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
const { type, uploadId } = parsed.data;
const { code } = req.params;
// @ts-ignore
const userId = req.userId as string;


const room = db.prepare('SELECT 1 FROM rooms WHERE code = ? AND is_active = 1').get(code);
if (!room) return res.status(404).json({ error: 'Room not found' });


const participant = db.prepare('SELECT * FROM participants WHERE room_code = ? AND user_id = ?').get(code, userId) as any;
if (!participant) return res.status(400).json({ error: 'Join room first' });


const upload = db.prepare('SELECT * FROM uploads WHERE id = ? AND participant_id = ? AND room_code = ?').get(uploadId, participant.id, code) as any;
if (!upload) return res.status(400).json({ error: 'Upload not found' });
if (upload.used) return res.status(400).json({ error: 'Upload already used' });


const points = type === 'DRINK' ? 10 : 15;


const id = uuidv4();
const created_at = Date.now();
const tx = db.transaction(() => {
db.prepare('UPDATE uploads SET used = 1 WHERE id = ?').run(uploadId);
db.prepare('UPDATE participants SET score = score + ? WHERE id = ?').run(points, participant.id);
db.prepare('INSERT INTO scores (id, room_code, participant_id, type, points, created_at, upload_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
.run(id, code, participant.id, type, points, created_at, uploadId);
});
tx();


const leaderboard = db.prepare('SELECT display_name, score FROM participants WHERE room_code = ? ORDER BY score DESC, created_at ASC').all(code);
io.to(code).emit('leaderboard:update', { leaderboard });


return res.json({ ok: true, points, newScore: (db.prepare('SELECT score FROM participants WHERE id = ?').get(participant.id) as any).score });
}
}