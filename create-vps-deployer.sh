#!/bin/bash
# Run this script to generate VPS deployment commands

echo "Generating deployment files..."

# Get file sizes
css_size=$(wc -c < dist/assets/index-CtTbJDgZ.css)
js_size=$(wc -c < dist/assets/index-CGoKsqYZ.js)
vendor_size=$(wc -c < dist/assets/vendor-CQW2wFTC.js)
supabase_size=$(wc -c < dist/assets/supabase-BXTA4Nr8.js)

echo "File sizes:"
echo "  CSS: $(numfmt --to=iec-i --suffix=B $css_size)"
echo "  Main JS: $(numfmt --to=iec-i --suffix=B $js_size)"
echo "  Vendor JS: $(numfmt --to=iec-i --suffix=B $vendor_size)"
echo "  Supabase JS: $(numfmt --to=iec-i --suffix=B $supabase_size)"
echo ""

# Create VPS commands file
cat > vps-commands.txt << 'VPSEOF'
# SyncArch VPS Deployment Commands
# Copy and paste these commands into your VPS terminal

echo "🚀 Starting deployment..."
rm -rf /var/www/syncarch/*
mkdir -p /var/www/syncarch/assets /var/www/syncarch/icons
cd /var/www/syncarch

# Create structure files
VPSEOF

echo "cat > _redirects << 'EOF'" >> vps-commands.txt
cat dist/_redirects >> vps-commands.txt 2>/dev/null || echo "/*    /index.html   200" >> vps-commands.txt
echo "EOF" >> vps-commands.txt
echo "" >> vps-commands.txt

echo "cat > index.html << 'EOF'" >> vps-commands.txt
cat dist/index.html >> vps-commands.txt
echo "EOF" >> vps-commands.txt
echo "" >> vps-commands.txt

echo "cat > manifest.json << 'EOF'" >> vps-commands.txt
cat dist/manifest.json >> vps-commands.txt
echo "EOF" >> vps-commands.txt
echo "" >> vps-commands.txt

echo "cat > sw.js << 'EOF'" >> vps-commands.txt
cat dist/sw.js >> vps-commands.txt
echo "EOF" >> vps-commands.txt
echo "" >> vps-commands.txt

# For assets, we'll use a different approach
echo "# Now upload assets - files are too large for paste" >> vps-commands.txt
echo "# Use one of these methods:" >> vps-commands.txt
echo "" >> vps-commands.txt
echo "chown -R www-data:www-data /var/www/syncarch" >> vps-commands.txt
echo "chmod -R 755 /var/www/syncarch" >> vps-commands.txt
echo 'echo "✅ Structure deployed! Now upload assets..."' >> vps-commands.txt

echo "✅ VPS commands generated in: vps-commands.txt"
echo ""
echo "Next step: Upload asset files separately"

