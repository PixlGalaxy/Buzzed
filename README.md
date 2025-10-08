# 🍻 Buzzed – Interactive Drink Tracker

**Buzzed** is an interactive web app designed to make social events more engaging by letting users **track and compete** with their drink count in real time — *Kahoot style!* 

Players join a **game room** using a unique code, upload a selfie, and start logging their drinks.  
Each upload earns points:
- **Drink** → +10 pts  
- **Shot** → +15 pts  

A **real-time leaderboard** (via Socket.IO) updates instantly for everyone in the same room.  
All uploaded images are stored securely and automatically deleted after **48 hours** for privacy.

---

## Project Structure (Directory Tree)

```
Buzzed/
├── backend/
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── src/
│       ├── auth.ts
│       ├── cleanup.ts
│       ├── db.ts
│       ├── index.ts
│       ├── rooms.ts
│       ├── schema.ts
│       ├── scoring.ts
│       ├── types.ts
│       └── uploads.ts
│
├── frontend/
│   ├── node_modules/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/
│   │   │   └── react.svg
│   │   ├── components/
│   │   │   ├── LeaderboardTable.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── RoomCodeJoin.tsx
│   │   ├── lib/
│   │   │   └── socket.ts
│   │   ├── routes/
│   │   │   ├── Buzzed.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Room.tsx
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── index.html
│
├── uploads/                # Uploaded images (auto-deleted after 48h)
├── .env                    # Environment variables
├── .env.example
├── .dockerignore
├── .gitignore
├── nginx.conf              # Nginx reverse proxy + SPA routes
├── Dockerfile              # Multi-stage build (frontend + backend + nginx)
└── README.md
```

---

## Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | React + TypeScript + Vite + TailwindCSS + React Router |
| **Backend** | Node.js + Express + Socket.IO + SQLite + TypeScript |
| **Auth** | JWT + bcryptjs |
| **File Uploads** | Multer (temporary storage per room) |
| **Realtime** | WebSockets (leaderboard updates) |
| **Containerization** | Docker + Nginx reverse proxy |
| **Cleanup** | Node-cron (auto-delete old uploads) |

---

## Environment Variables (.env)

```bash
# Backend
PORT=8080
JWT_SECRET=super-secret-key
CORS_ORIGIN=http://localhost:5173
MAX_UPLOAD_MB=7
UPLOADS_DIR=/app/uploads
IMAGE_TTL_HOURS=48
```

---

## How to Run

### Development mode (2 terminals)
```bash - terminal 1
# Backend
cd backend
npm install
cp ../.env.example ../.env
npm run dev
```

```bash - terminal 2
# Frontend
cd ../frontend
npm install
npm run dev
```
Then open: http://localhost:5173

---

### Production with Docker (single container)
```bash
docker build -t buzzed .
docker run -d   -p 8080:80   --env-file .env   -v $(pwd)/uploads:/app/uploads   buzzed
```
Then open: **http://localhost:8080**

---

## Nginx Reverse Proxy

The app is served by Nginx as a static SPA, and requests to `/api` or `/socket.io` are automatically proxied to the backend.

Example config (`nginx.conf`):
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;
}
location /socket.io/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

---

## Auto-cleanup Job
A cron job runs hourly to delete all uploads older than `IMAGE_TTL_HOURS` (default 48h) and remove their database entries.

---

## Main Features
- JWT authentication
- File upload per room (temporary storage)
- Real-time leaderboard
- Create or join rooms by code
- Image cleanup every 48 hours
- Full-Stack Docker image, frontend + backend

---

## Future Add-ons
- Google OAuth login  
- NSFW/AI moderation for uploaded pictures  
- Host control (pause/reset room)  
- S3-compatible external storage  
- Export Room Data As XML Or Excel With User Images 
- Global leaderboard across events
