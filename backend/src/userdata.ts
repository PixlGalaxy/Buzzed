import type { Request, Response } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { v4 as uuidv4 } from 'uuid'
import { db } from './db.js'

const USERDATA_DIR = process.env.USERDATA_DIR || path.resolve(process.cwd(), 'userdata')
if (!fs.existsSync(USERDATA_DIR)) fs.mkdirSync(USERDATA_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const id = req.userId as string
    const dir = path.join(USERDATA_DIR, id)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    cb(null, `avatar${path.extname(file.originalname) || '.jpg'}`)
  },
})

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ok = ['image/jpeg', 'image/png', 'image/webp']
  if (ok.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Invalid file type'))
}

export const uploadAvatar = multer({ storage, fileFilter }).single('avatar')

export function handleUploadAvatar(req: Request, res: Response) {
  const userId = req.userId as string
  if (!req.file) return res.status(400).json({ error: 'No file' })

  const avatarPath = `/userdata/${userId}/${req.file.filename}`
  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarPath, userId)
  res.json({ avatar: avatarPath })
}
