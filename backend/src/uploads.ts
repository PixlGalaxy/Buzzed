import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db.js';


const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });


const storage = multer.diskStorage({
destination: (req, file, cb) => {
const code = req.params.code;
const dir = path.join(UPLOADS_DIR, code);
fs.mkdirSync(dir, { recursive: true });
cb(null, dir);
},
filename: (req, file, cb) => {
const ext = path.extname(file.originalname) || '.jpg';
cb(null, `${Date.now()}_${uuidv4()}${ext}`);
}
});


const limits = { fileSize: ((parseInt(process.env.MAX_UPLOAD_MB || '7', 10)) * 1024 * 1024) };


const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
const ok = ['image/jpeg', 'image/png', 'image/webp'];
if (ok.includes(file.mimetype)) return cb(null, true);
cb(new Error('Invalid file type'));
};


export const uploadDrink = multer({ storage, limits, fileFilter }).single('image');
export const uploadSelfie = multer({ storage, limits, fileFilter }).single('image');


export function handleUploadDrink(req: Request, res: Response) {
// @ts-ignore
const userId = req.userId as string;
const { code } = req.params;
const room = db.prepare('SELECT 1 FROM rooms WHERE code = ?').get(code);
if (!room) return res.status(404).json({ error: 'Room not found' });
const participant = db.prepare('SELECT * FROM participants WHERE room_code = ? AND user_id = ?').get(code, userId) as any;
if (!participant) return res.status(400).json({ error: 'Join room first' });
if (!req.file) return res.status(400).json({ error: 'No file' });
const id = uuidv4();
const created_at = Date.now();
const filepath = (req.file as any).path;
db.prepare('INSERT INTO uploads (id, room_code, participant_id, filepath, created_at, used) VALUES (?, ?, ?, ?, ?, 0)')
.run(id, code, participant.id, filepath, created_at);
return res.json({ uploadId: id, url: `/uploads/${code}/${path.basename(filepath)}` });
}


export function handleUploadSelfie(req: Request, res: Response) {
// @ts-ignore
const userId = req.userId as string;
const { code } = req.params;
const participant = db.prepare('SELECT * FROM participants WHERE room_code = ? AND user_id = ?').get(code, userId) as any;
if (!participant) return res.status(400).json({ error: 'Join room first' });
if (!req.file) return res.status(400).json({ error: 'No file' });
const filepath = (req.file as any).path;
db.prepare('UPDATE participants SET selfie_url = ? WHERE id = ?').run(`/uploads/${code}/${path.basename(filepath)}`, participant.id);
return res.json({ url: `/uploads/${code}/${path.basename(filepath)}` });
}