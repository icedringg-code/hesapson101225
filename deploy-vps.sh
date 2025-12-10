#!/bin/bash

# VPS Deployment Script for syncarch.online
# Usage: ./deploy-vps.sh

set -e

echo "🚀 Starting VPS Deployment..."

# Configuration
VPS_HOST="31.97.78.86"
VPS_USER="root"
VPS_PATH="/var/www/html/public_html"
LOCAL_DIST="./dist"

echo "📦 Building project..."
npm run build

echo "🗑️  Cleaning VPS public_html directory..."
ssh ${VPS_USER}@${VPS_HOST} "rm -rf ${VPS_PATH}/*"

echo "📤 Uploading files to VPS..."
scp -r ${LOCAL_DIST}/* ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

echo "🔒 Setting correct permissions..."
ssh ${VPS_USER}@${VPS_HOST} "chmod -R 755 ${VPS_PATH} && chmod 644 ${VPS_PATH}/.htaccess"

echo "✅ Deployment completed successfully!"
echo "🌐 Visit: https://syncarch.online"
