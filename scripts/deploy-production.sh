#!/bin/bash

echo "Preparing to deploy to production..."
echo "Version: $(node -p "require('./package.json').version")"

# Проверка наличия изменений в git
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ There are uncommitted changes. Please commit or stash them before deploying."
  exit 1
fi

echo "✅ Git repository is clean."

# Проверка, что мы находимся в ветке main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️ You are not on the main branch. Please switch to main before deploying."
  exit 1
fi

echo "✅ Current branch is main."

echo "📋 Deployment checklist:"
echo "1. Make sure you have set up the following environment variables in Vercel:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - NEXT_PUBLIC_APP_URL"
echo "   - NEXT_PUBLIC_API_URL"
echo "   - TELEGRAM_BOT_TOKEN"
echo "   - BOT_MODE"
echo "   - BOT_WEBHOOK_URL"
echo "   - BOT_AUTO_RESTART"

echo ""
echo "2. Deploy to production using Vercel CLI or GitHub integration."
echo "   - Using Vercel CLI: vercel --prod"
echo "   - Using GitHub: Push to main branch and let Vercel auto-deploy"

echo ""
echo "🚀 Ready to deploy! Execute the following command to deploy manually:"
echo "vercel --prod"
