#!/bin/bash

# AIX Format - Vercel Deployment Script
# This script will deploy the project to Vercel using CLI

set -e

echo "🚀 AIX Format Deployment"
echo "========================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel@latest
fi

echo "✅ Vercel CLI ready"
echo ""

# Login to Vercel (will open browser)
echo "🔐 Logging in to Vercel..."
vercel login

echo ""
echo "🔗 Linking project..."
vercel link --yes

echo ""
echo "🏗️  Building and deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check deployment status:"
echo "   https://vercel.com/moeabdelaziz007/aix-format/deployments"
echo ""
echo "🌐 Live site:"
echo "   https://axiomid.app"

# Made with Bob
