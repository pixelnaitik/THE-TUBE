# 🎬 THE TUBE — Video Streaming Platform

A modern, full-stack YouTube-like video streaming platform built with **Next.js**, **Prisma**, and **HLS.js**.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)

---

## ✨ Features

- 🔐 **Authentication** — Sign Up / Sign In with email & password (NextAuth.js + bcrypt)
- 📤 **Video Upload** — Drag-and-drop upload with progress tracking
- 🎞️ **HLS Adaptive Streaming** — Videos transcoded into HLS chunks via FFmpeg
- 📺 **Custom Video Player** — Built with HLS.js, supports:
  - ▶️ Play / Pause with click
  - ⏩ Double-tap to seek ±10 seconds
  - 🏎️ Playback speed control (0.5x, 1x, 1.5x, 2x)
  - ⛶ Fullscreen mode
  - Auto-hiding controls
- 🏠 **Home Feed** — Dynamic video grid with category filter chips
- 📄 **Watch Page** — Full video player with metadata, like/dislike buttons, description, and recommendations sidebar
- 🌙 **Dark Mode UI** — Premium YouTube-inspired dark theme
- 📱 **Responsive** — Works on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| **Backend** | Next.js API Routes, NextAuth.js |
| **Database** | SQLite via Prisma ORM |
| **Video** | FFmpeg (HLS transcoding), HLS.js (adaptive playback) |
| **Auth** | NextAuth.js with Credentials Provider, bcryptjs |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [FFmpeg](https://ffmpeg.org/download.html) (optional — videos will fall back to MP4 if not installed)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/pixelnaitik/THE-TUBE.git
cd THE-TUBE

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Create the database
npx prisma db push

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First-time Setup

1. Click **Sign In** → switch to **Sign Up** tab
2. Create an account with any email and password
3. Click **Create** in the navbar to upload a video
4. Your video will appear on the homepage once processed!

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │   └── signup/route.ts          # User registration
│   │   ├── upload/route.ts              # Video upload endpoint
│   │   └── reprocess/route.ts           # Re-process stuck videos
│   ├── login/page.tsx                   # Sign In / Sign Up page
│   ├── upload/page.tsx                  # Drag & drop upload UI
│   ├── watch/[id]/page.tsx              # Video watch page
│   ├── page.tsx                         # Home feed
│   ├── layout.tsx                       # Root layout
│   └── globals.css                      # Global styles
├── components/
│   ├── Navbar.tsx                       # Top navigation bar
│   ├── Sidebar.tsx                      # Left sidebar
│   ├── VideoCard.tsx                    # Video thumbnail card
│   ├── VideoPlayer.tsx                  # HLS video player
│   └── Providers.tsx                    # NextAuth session provider
└── lib/
    ├── prisma.ts                        # Prisma client singleton
    ├── authOptions.ts                   # NextAuth configuration
    └── videoProcessor.ts                # FFmpeg HLS processor
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `NEXTAUTH_SECRET` | JWT signing secret | *(required)* |
| `NEXTAUTH_URL` | App base URL | `http://localhost:3000` |

---

## 📋 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npx prisma studio` | Open database GUI |
| `npx prisma db push` | Sync schema to database |

---

## 🗺️ Roadmap

- [ ] Multi-quality HLS (360p, 720p, 1080p)
- [ ] Search functionality
- [ ] Like / Dislike system
- [ ] Comment section
- [ ] Channel pages
- [ ] Video analytics
- [ ] Google / GitHub OAuth
- [ ] Live streaming support

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ by [@pixelnaitik](https://github.com/pixelnaitik)
