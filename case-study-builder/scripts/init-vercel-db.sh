#!/bin/bash

# Script to initialize Vercel Postgres database with Prisma schema
# Run this after deploying to Vercel

echo "🔄 Initializing Vercel Postgres database..."

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database (optional)
# npx prisma db seed

echo "✅ Database initialized successfully!"
echo "📝 You can now use your application"
