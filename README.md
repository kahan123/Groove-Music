# 🎵 Groove Music

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.x-blue.svg)](https://reactjs.org/)

**Groove Music** is a high-performance, premium music streaming platform designed with a modern **glassmorphic aesthetic**. It bridges the gap between massive music metadata (iTunes) and high-quality audio streaming (YouTube), providing a seamless, ad-free listening experience.

---

## ✨ Features

- **🔍 Global Discovery**: Search over 70 million songs via integration with the iTunes Music API.
- **🎧 Seamless Streaming**: High-fidelity audio extraction and streaming directly from YouTube.
- **💎 Glassmorphic UI**: A stunning, responsive interface with translucent elements, vibrant gradients, and smooth micro-animations.
- **🔐 Secure Authentication**: Integrated Google OAuth 2.0 for quick and secure user onboarding.
- **📂 Personal Library**: Create, rename, and manage custom playlists.
- **❤️ Liked Songs**: Dedicated section for your favorite tracks with one-click favoriting.
- **📻 Artist Radio**: Dynamically generate a radio station based on your favorite artist.
- **🎹 Smart Controls**: Keyboard shortcuts (Space to Play/Pause, Ctrl+Arrows for Skip) and Hardware Media Key support.
- **📱 Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile devices with a dedicated mobile player view.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite for ultra-fast builds.
- **Styling**: Vanilla CSS with CSS Variables for theme management and Glassmorphism effects.
- **Icons**: Lucide React for crisp, consistent iconography.
- **Auth**: `@react-oauth/google` for seamless social login.

### Backend
- **Runtime**: Node.js & Express.
- **Database**: MongoDB with Mongoose for user data and playlist persistence.
- **Audio Engine**: `yt-dlp-wrap` and `youtubei.js` for robust YouTube interaction.
- **Security**: JSON Web Tokens (JWT) for session management and `dotenv` for secret handling.

---

## 📂 Project Structure

```text
Groove-Music/
├── backend/                # Node.js Express Server
│   ├── src/
│   │   ├── config/         # DB connection & environment setup
│   │   ├── controllers/    # Request handling logic
│   │   ├── middleware/     # Auth & error handlers
│   │   ├── models/         # Mongoose Schemas (User, SystemConfig)
│   │   ├── routes/         # Modular API endpoints (Auth, Song, User)
│   │   ├── services/       # External API Clients (iTunes, YouTube, yt-dlp)
│   │   ├── app.js          # App definition & middleware
│   │   └── server.js       # Server entry point
│   ├── tests/              # System & unit tests
│   └── package.json
├── frontend/               # React Vite Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/     # Persistent UI (Sidebar, Player, TopBar)
│   │   │   └── shared/     # Reusable UI atoms
│   │   ├── context/        # Global state (Music, Toast)
│   │   ├── hooks/          # Custom business logic hooks
│   │   ├── pages/          # Full-page views (Home, Search, Playlists)
│   │   ├── services/       # API abstraction layer
│   │   └── styles/         # Global & component-specific CSS
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local instance or MongoDB Atlas URI
- **Python**: Required for `yt-dlp` audio extraction
- **FFmpeg**: (Optional) For advanced audio processing

### 1. Clone the Repository
```bash
git clone https://github.com/kahan123/Groove-Music.git
cd Groove-Music
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=3000
MONGO_URI=your_mongodb_uri
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
COOKIE_KEY=any_random_string
GOOGLE_CLIENT_ID=your_google_client_id
ADMIN_SECRET=your_admin_password
```
Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Start the frontend:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎹 Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause |
| `Ctrl` + `→` | Next Track |
| `Ctrl` + `←` | Previous Track |
| `M` | Mute / Unmute |

---

## 🛡️ Architecture Overview: How Streaming Works
Groove Music uses a **distributed audio processing pipeline**:
1. **Metadata Phase**: The client searches iTunes for high-quality metadata and album art.
2. **Search Phase**: The backend uses `youtubei.js` to find the most relevant, high-quality audio match on YouTube.
3. **Streaming Phase**: `yt-dlp` spawns a stream on the backend, which is piped directly to the frontend `audio` element using `audio/mpeg` chunking, ensuring minimal latency and no local storage requirements.

---

## 🛣️ Roadmap
- [ ] **Desktop App**: Electron wrapper for a native experience.
- [ ] **Offline Mode**: Local caching of favorite tracks.
- [ ] **Lyrics**: Real-time synchronized lyrics integration.
- [ ] **Social**: Shareable playlists and "Listening Now" status.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Created with ❤️ by the Groove Music Team.*
