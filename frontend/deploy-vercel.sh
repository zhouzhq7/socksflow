#!/bin/bash
# SocksFlow Frontend Vercel Deployment Script
# Usage: ./deploy-vercel.sh [vercel-token]

set -e

echo "🚀 SocksFlow Frontend Vercel Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Login to Vercel
if [ -z "$1" ]; then
    echo -e "${YELLOW}No token provided. Please login manually...${NC}"
    vercel login
else
    echo -e "${GREEN}Using provided token for authentication${NC}"
    export VERCEL_TOKEN="$1"
fi

# Link project (if not already linked)
if [ ! -d ".vercel" ]; then
    echo -e "${YELLOW}Linking project to Vercel...${NC}"
    vercel link --yes --project socksflow-frontend 2>/dev/null || vercel link
fi

# Set environment variables
echo -e "${YELLOW}Configuring environment variables...${NC}"
vercel env add NEXT_PUBLIC_API_URL production <<< "https://socksflow-api.up.railway.app/api/v1" 2>/dev/null || echo "API URL already configured or use: vercel env add NEXT_PUBLIC_API_URL"
vercel env add NEXT_PUBLIC_APP_NAME production <<< "SocksFlow" 2>/dev/null || true
vercel env add NEXT_PUBLIC_APP_URL production <<< "https://socksflow.vercel.app" 2>/dev/null || true

# Deploy
echo -e "${GREEN}Deploying to Vercel...${NC}"
if [ -z "$1" ]; then
    vercel --prod
else
    vercel --prod --token "$1"
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📋 Post-Deployment Checklist:"
echo "  1. Check deployment URL in Vercel Dashboard"
echo "  2. Update CORS settings in Railway backend with Vercel URL"
echo "  3. Test login and subscription features"
