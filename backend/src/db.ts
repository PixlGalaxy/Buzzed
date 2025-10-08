import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';


const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);


export const db = new Database(path.join(dataDir, 'buzzed.db'));


db.pragma('journal_mode = WAL');


db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rooms (
    code TEXT PRIMARY KEY,
    host_user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL,
    user_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    selfie_url TEXT,
    score INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_participants_room ON participants(room_code);


    CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    filepath TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_uploads_room ON uploads(room_code);


    CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('DRINK','SHOT')),
    points INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    upload_id TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_scores_room ON scores(room_code);
`);