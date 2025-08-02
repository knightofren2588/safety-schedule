#!/bin/bash

echo "🚀 Deploying Safety Schedule to Vercel..."

# Build the project
echo "📦 Building project..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📱 Your app is now live and accessible to your team!"
echo "🔗 Check your Vercel dashboard for the URL" 