# 🎬 THE TUBE — Video Streaming Platform

A modern, full-stack YouTube clone built with **Next.js 16**, **Prisma**, and **HLS.js** featuring adaptive bitrate streaming, social features, and a premium dark UI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![FFmpeg](https://img.shields.io/badge/FFmpeg-8-green?logo=ffmpeg)

---

## ✨ Features

### 🎥 Video
- **Multi-Quality HLS Streaming** — 360p, 720p, 1080p adaptive bitrate via FFmpeg
- **YouTube-Style Quality Picker** — Auto + manual quality selection
- **Custom Video Player** — Play/pause, seek, volume, speed (0.25x–2x), fullscreen
- **Keyboard Shortcuts** — Space/K (play), F (fullscreen), M (mute), ←→ (seek), ↑↓ (volume), P (PiP)
- **Picture-in-Picture** — Floating mini-player
- **Auto Thumbnail Generation** — FFmpeg extracts a frame at 1 second
- **Duration Extraction** — Auto-detected via ffprobe
- **Upload with Progress** — Real-time upload percentage with drag-and-drop
- **Video Tags** — Categorize videos with comma-separated tags

### 👤 Social
- **Auth** — Sign Up / Sign In with email & password (bcrypt + NextAuth)
- **Channel Pages** — `/channel/[userId]` with banner, avatar, subscriber count
- **Subscribe System** — Subscribe/unsubscribe to channels
- **Like/Dislike** — Toggle reactions with optimistic UI
- **Threaded Comments** — Reply to comments with collapsible threads
- **Notifications** — Bell icon with unread badge (new video, subscriber, comment alerts)
- **User Profiles** — Avatar upload, stats dashboard (videos, views, likes)

### 📺 Discovery
- **Home Feed** — Video grid with category filter chips (Gaming, Music, etc.)
- **Sort Videos** — Newest, Most Viewed, Oldest
- **Search** — Search videos by title
- **Recommendations** — Sidebar with suggested videos on watch page
- **Subscriptions Feed** — `/subscriptions` showing videos from subscribed channels

### 📊 Tracking
- **View Counter** — Auto-increments on each watch
- **Watch History** — `/history` showing recently watched videos
- **Liked Videos** — `/liked` showing all your liked videos
- **Video Edit/Delete** — Authors can edit title/description/tags or delete videos
- **Share** — Copy video link to clipboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| **Backend** | Next.js API Routes, NextAuth.js |
| **Database** | SQLite via Prisma ORM |
| **Video** | FFmpeg (multi-quality HLS), HLS.js (adaptive playback) |
| **Auth** | NextAuth.js with Credentials Provider, bcryptjs |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [FFmpeg](https://ffmpeg.org/download.html) — Install via `winget install Gyan.FFmpeg` or `choco install ffmpeg`

### Installation

```bash
# Clone the repo
git clone https://github.com/pixelnaitik/THE-TUBE.git
cd THE-TUBE

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Create the database
npx prisma db push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` / `K` | Play / Pause |
| `F` | Fullscreen |
| `M` | Mute / Unmute |
| `←` / `→` | Seek ±5 seconds |
| `↑` / `↓` | Volume ±10% |
| `>` / `<` | Speed ±0.25x |
| `P` | Picture-in-Picture |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/signup/         # User registration
│   │   ├── notifications/       # Get/mark-read notifications
│   │   ├── search/              # Search videos
│   │   ├── subscribe/           # Subscribe/unsubscribe + status
│   │   ├── upload/              # Video upload with tags
│   │   ├── user/avatar/         # Avatar upload
│   │   └── videos/[id]/
│   │       ├── route.ts         # Edit/delete video
│   │       ├── comment/         # CRUD comments with replies
│   │       ├── like/            # Like/dislike toggle
│   │       └── view/            # View counter + history
│   ├── channel/[userId]/        # Channel page
│   ├── history/                 # Watch history
│   ├── liked/                   # Liked videos
│   ├── login/                   # Sign In / Sign Up
│   ├── profile/                 # User profile + avatar
│   ├── search/                  # Search results
│   ├── subscriptions/           # Subscription feed
│   ├── upload/                  # Upload with progress
│   └── watch/[id]/              # Video watch page
├── components/
│   ├── AvatarUpload.tsx         # Profile picture upload
│   ├── CommentSection.tsx       # Threaded comments
│   ├── HomeFilters.tsx          # Category chips + sort
│   ├── LikeButtons.tsx          # Like/dislike with counts
│   ├── Navbar.tsx               # Search + notifications
│   ├── Sidebar.tsx              # Navigation links
│   ├── SubscribeButton.tsx      # Subscribe toggle
│   ├── VideoActions.tsx         # Share/edit/delete
│   ├── VideoCard.tsx            # Video thumbnail card
│   ├── VideoPlayer.tsx          # HLS player + quality picker
│   └── ViewCounter.tsx          # Auto view tracking
└── lib/
    ├── authOptions.ts           # NextAuth config
    ├── prisma.ts                # Prisma singleton
    └── videoProcessor.ts        # Multi-quality HLS encoder
```

---

## 🗺️ Roadmap

- [ ] Google / GitHub OAuth
- [ ] Playlists with autoplay
- [ ] Video analytics dashboard
- [ ] Captions / Subtitles (.srt)
- [ ] Shorts / Vertical video feed
- [ ] Live streaming (RTMP → HLS)
- [ ] CDN integration (S3 / R2)
- [ ] Mobile PWA

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

Built with ❤️ by [@pixelnaitik](https://github.com/pixelnaitik)
