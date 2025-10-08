import type { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterSchema, LoginSchema } from './schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function signToken(userId: string) {
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string };
    // @ts-ignore
    req.userId = decoded.uid;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function register(req: Request, res: Response) {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, email, password } = parsed.data;

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, 10);
  const created_at = Date.now();
  db.prepare('INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, email, password_hash, created_at);
  const token = signToken(id);
  return res.json({ token, user: { id, name, email } });
}

export function login(req: Request, res: Response) {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user.id);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}

export function me(req: Request, res: Response) {
  // @ts-ignore
  const userId = req.userId as string;
  const user = db.prepare('SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?').get(userId);
  return res.json({ user });
}
