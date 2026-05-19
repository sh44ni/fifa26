#!/bin/bash
set -e

echo "🏆 2026 World Cup Draw — Payout Vote Setup"
echo "============================================"

# Install Node.js dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Seed the database (creates AppSettings with voting token)
echo "🌱 Seeding database..."
npx tsx prisma/seed.ts

# Build Next.js
echo "🔨 Building Next.js application..."
npm run build

# Create logs directory
mkdir -p logs

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

echo ""
echo "✅ Setup complete!"
echo "🔗 Application running on http://localhost:3000"
echo ""
echo "📋 Next steps:"
echo "  1. Update .env with your domain and secrets"
echo "  2. Copy nginx.conf to /etc/nginx/sites-available/"
echo "  3. Set up SSL with: sudo certbot --nginx -d yourdomain.com"
echo "  4. Run: pm2 startup  (to enable auto-start on boot)"
echo ""
