import cron from 'node-cron';
import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.js';


const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(process.cwd(), 'uploads');
const HOURS = parseInt(process.env.IMAGE_TTL_HOURS || '48', 10);


export function startCleanupJob() {
// Run hourly
cron.schedule('0 * * * *', () => {
try {
const threshold = Date.now() - HOURS * 3600 * 1000;
const oldUploads = db.prepare('SELECT id, filepath FROM uploads WHERE created_at < ?').all(threshold) as any[];
for (const u of oldUploads) {
try { fs.unlinkSync(u.filepath); } catch {}
}
db.prepare('DELETE FROM uploads WHERE created_at < ?').run(threshold);
// Optionally prune inactive/old rooms later
} catch (e) {
console.error('Cleanup error', e);
}
});
}