# 2026 World Cup Draw — Payout Vote

A full-stack real-time voting application for deciding the payout structure of a $4,800 World Cup pool.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma + SQLite, Socket.io, Framer Motion

---

## Features

- 🗳️ **Voter Page** — QR code-gated voting form with 10 payout options
- 📊 **Live Display** — Real-time animated bar chart for projection screens
- 🔧 **Admin Panel** — Full dashboard with vote log, QR code management, and controls
- ⚡ **Real-time** — Socket.io pushes updates to all connected clients instantly
- 🔒 **Secure** — JWT auth for admin, token-gated voting, IP duplicate prevention

---

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Generate Prisma client + run migrations
npx prisma generate
npx prisma migrate dev

# Seed the database (creates voting token)
npm run seed

# Start dev server (custom server with Socket.io)
npm run dev
```

The app will be available at `http://localhost:3000`

---

## VPS Deployment Guide

### Prerequisites
- Ubuntu 22.04+ or similar Linux VPS
- Node.js 20+ installed
- Nginx installed (`sudo apt install nginx`)
- A domain name pointed to your server IP

### Step 1: Clone & Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/wc2026-vote.git
cd wc2026-vote

# Copy and edit environment variables
cp .env.example .env
nano .env
```

Update `.env` with your values:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="generate-a-strong-random-secret-here"
ADMIN_USER="admin"
ADMIN_PASSWORD="your-secure-password"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### Step 2: Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This will:
1. Install npm dependencies
2. Generate Prisma client
3. Run database migrations
4. Seed the AppSettings (generates voting token)
5. Build the Next.js application
6. Start the app with PM2

### Step 3: Configure Nginx

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/wc2026-vote
sudo ln -s /etc/nginx/sites-available/wc2026-vote /etc/nginx/sites-enabled/

# Edit the config — replace "yourdomain.com" with your actual domain
sudo nano /etc/nginx/sites-available/wc2026-vote

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 4: SSL Certificate

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
```

### Step 5: PM2 Auto-Start

```bash
# Generate startup script
pm2 startup

# Follow the printed command (copy/paste it)
# Then save the current process list
pm2 save
```

---

## PM2 Commands

```bash
pm2 status              # Check app status
pm2 logs wc2026-vote    # View logs
pm2 restart wc2026-vote # Restart the app
pm2 stop wc2026-vote    # Stop the app
pm2 delete wc2026-vote  # Remove from PM2
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/vote?token=XYZ` | Voter page (token required) |
| `/vote` | "Scan QR code" screen |
| `/live` | Live results display |
| `/admin` | Admin panel (login required) |

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/vote` | Token | Submit a vote |
| GET | `/api/results` | None | Get vote counts |
| POST | `/api/admin/login` | None | Admin login |
| GET | `/api/admin/votes` | JWT | Full vote log |
| DELETE | `/api/admin/votes/:id` | JWT | Delete a vote |
| POST | `/api/admin/reset` | JWT | Reset all votes |
| GET/PATCH | `/api/admin/settings` | JWT | Toggle live display |
| GET | `/api/admin/qr` | JWT | QR code PNG |

---

## Architecture

```
Custom Server (server.ts)
├── Next.js App Handler
├── Socket.io Server
│   ├── vote_update events
│   └── settings_update events
└── HTTP API Routes
    └── Prisma + SQLite (dev.db)
```
