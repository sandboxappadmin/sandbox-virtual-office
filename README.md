# 🏢 Virtual Office

A real-time multiplayer virtual office built with **Phaser 3**, **Socket.io**, and **WebRTC**.  
Inspired by Gather.town — top-down 2D map, avatar movement, proximity video calling, and live chat.

---

## ✨ Features

- 🗺️ **2D Office Map** — zones for Engineering, Design, Product, Meeting Rooms, Lounge
- 🕹️ **WASD / Arrow keys** to move your avatar
- 👥 **Real-time multiplayer** — see all teammates move live
- 💬 **Live chat** sidebar with room history
- 📍 **Proximity detection** — toast notification when near a teammate
- 📹 **WebRTC video call** — press V when near someone to start a call
- 🎤 **Mute / camera toggle** in the call UI
- 🎨 **Fully procedural graphics** — no external image assets needed

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- npm

### 1. Clone & install

```bash
git clone <your-repo-url>
cd virtual-office
npm run install:all
```

### 2. Set up env files

```bash
# Server
cp server/.env.example server/.env

# Client
cp client/.env.example client/.env
```

### 3. Run everything

```bash
npm run dev
```

- **Client** → http://localhost:5173
- **Server** → http://localhost:3001

Open two browser tabs/windows to test multiplayer!

---

## 🗂 Project Structure

```
virtual-office/
├── client/                  # Phaser 3 frontend (Vite)
│   ├── index.html           # Login screen + UI overlays
│   ├── src/
│   │   ├── main.js          # Entry: login, Phaser init, chat wiring
│   │   ├── socket.js        # Socket.io client singleton
│   │   ├── webrtc.js        # WebRTC peer connection (simple-peer)
│   │   ├── styles/main.css  # All UI styles
│   │   └── scenes/
│   │       ├── BootScene.js   # Asset preload + procedural texture gen
│   │       └── OfficeScene.js # Game world: map, avatars, movement, zones
│   └── vite.config.js
│
├── server/                  # Node.js + Socket.io backend
│   └── src/index.js         # Room state, player sync, RTC signalling
│
├── render.yaml              # One-click Render.com deploy
├── package.json             # Monorepo scripts
└── README.md
```

---

## ☁️ Deploy

### Option A — Render (recommended, free tier)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Point to your repo → it reads `render.yaml` automatically
4. After deploy:
   - Copy your **server URL** (e.g. `https://virtual-office-server.onrender.com`)
   - Set `VITE_SERVER_URL` env var on the client service
   - Set `CLIENT_URL` env var on the server service to your client URL

### Option B — Vercel (client) + Render (server)

**Server → Render:**
```
Root dir: server
Build: npm install
Start: npm start
Env: PORT=3001, CLIENT_URL=https://your-app.vercel.app
```

**Client → Vercel:**
```
Framework: Vite
Root dir: client
Build: npm run build
Output: dist
Env: VITE_SERVER_URL=https://your-server.onrender.com
      VITE_ROOM_ID=main-office
```

> ⚠️ Vercel is serverless — **cannot** run Socket.io. Always host the server on Render or Railway.

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| WASD / Arrow keys | Move avatar |
| V | Video call nearest player |
| Enter | Send chat message |

---

## 🔧 Extending

### Add more zones / rooms
Edit the `ZONES` array in `OfficeScene.js` and the `MAP` grid (0=empty, 1=wall, 2=floor, 3=carpet, 4=meeting).

### Add animated sprite sheets
Replace `avatar-{idx}` in `BootScene.js` with `this.load.spritesheet(...)` and add animations in `OfficeScene.js`.

### Add screen sharing
In `webrtc.js`, replace `getUserMedia` with `getDisplayMedia` for screen share.

### Persist chat (database)
Replace the in-memory `chatHistory` array in `server/src/index.js` with a Redis or Supabase store.

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Game engine | Phaser 3 |
| Multiplayer sync | Socket.io |
| Video/audio | WebRTC (simple-peer) |
| Frontend bundler | Vite |
| Backend | Node.js + Express |
| Deploy (server) | Render |
| Deploy (client) | Vercel / Render Static |
