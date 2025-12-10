#!/bin/bash

# SyncArch VPS Deployment Script
# Run this on your VPS: bash <(curl -s SCRIPT_URL)

echo "🚀 Starting SyncArch Deployment..."
echo ""

# Create temporary directory
cd /tmp
rm -rf syncarch_deploy
mkdir -p syncarch_deploy
cd syncarch_deploy

echo "📦 Creating deployment structure..."

# Create directory structure
mkdir -p assets icons

# Create _redirects for SPA routing
cat > _redirects << 'REDIR'
/*    /index.html   200
REDIR

# Create index.html
cat > index.html << 'HTMLEOF'
<!doctype html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

    <title>SyncArch - İş Takip Sistemi</title>
    <meta name="description" content="Mimarlık ofisleri için profesyonel iş takip ve yönetim sistemi">

    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#2563eb" />
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="SyncArch">

    <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png">
    <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png">

    <meta property="og:title" content="SyncArch - İş Takip Sistemi">
    <meta property="og:description" content="Mimarlık ofisleri için profesyonel iş takip ve yönetim sistemi">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://syncarch.com/icons/icon-512x512.png">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="SyncArch - İş Takip Sistemi">
    <meta name="twitter:description" content="Mimarlık ofisleri için profesyonel iş takip ve yönetim sistemi">
    <meta name="twitter:image" content="https://syncarch.com/icons/icon-512x512.png">
  <script type="module" crossorigin src="/assets/index-CGoKsqYZ.js"></script>
  <link rel="modulepreload" crossorigin href="/assets/vendor-CQW2wFTC.js">
  <link rel="modulepreload" crossorigin href="/assets/supabase-BXTA4Nr8.js">
  <link rel="stylesheet" crossorigin href="/assets/index-CtTbJDgZ.css">
</head>
  <body>
    <div id="root"></div>
  </body>
</html>
HTMLEOF

echo "📝 Index.html created"
echo "⚠️  NOTE: You need to upload the following files manually:"
echo "  - dist/assets/index-CtTbJDgZ.css"
echo "  - dist/assets/index-CGoKsqYZ.js"
echo "  - dist/assets/vendor-CQW2wFTC.js"
echo "  - dist/assets/supabase-BXTA4Nr8.js"
echo "  - dist/manifest.json"
echo "  - dist/sw.js"
echo ""
echo "Use SCP or SFTP to transfer these files from your local build to the VPS."
echo ""
echo "📂 Expected structure in /var/www/syncarch/:"
echo "  /var/www/syncarch/index.html"
echo "  /var/www/syncarch/_redirects"
echo "  /var/www/syncarch/manifest.json"
echo "  /var/www/syncarch/sw.js"
echo "  /var/www/syncarch/assets/*.js"
echo "  /var/www/syncarch/assets/*.css"
echo ""
echo "🔄 Preparing deployment directory..."

# Clean and prepare deployment directory
rm -rf /var/www/syncarch/*
mkdir -p /var/www/syncarch/assets
mkdir -p /var/www/syncarch/icons

# Copy the files we have
cp index.html /var/www/syncarch/
cp _redirects /var/www/syncarch/

# Set permissions
chown -R www-data:www-data /var/www/syncarch
chmod -R 755 /var/www/syncarch

echo ""
echo "✅ Base structure ready!"
echo ""
echo "⏳ Waiting for asset files..."
echo "Please upload the build assets using one of these methods:"
echo ""
echo "Method 1 - SCP (from your local machine):"
echo "  scp -r dist/assets/* root@31.97.78.86:/var/www/syncarch/assets/"
echo "  scp dist/manifest.json root@31.97.78.86:/var/www/syncarch/"
echo "  scp dist/sw.js root@31.97.78.86:/var/www/syncarch/"
echo ""
echo "Method 2 - Manual paste (if files are small):"
echo "  Run the companion script to receive file contents"
echo ""
