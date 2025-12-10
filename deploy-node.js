#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const VPS_HOST = '31.97.78.86';
const VPS_USER = 'root';
const VPS_PASSWORD = '00203549Rk..';
const VPS_PATH = '/var/www/syncarch-is-takip';

console.log('🚀 SyncArch İş Takip - VPS Otomatik Deployment');
console.log('='.repeat(50));

async function runCommand(cmd, description) {
  console.log(`\n${description}...`);
  try {
    const { stdout, stderr } = await execAsync(cmd);
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
    return true;
  } catch (error) {
    console.error(`❌ Hata: ${error.message}`);
    return false;
  }
}

async function deploy() {
  try {
    // 1. Deployment package oluştur
    console.log('\n📦 Deployment package oluşturuluyor...');
    await execAsync('tar -czf vps-deployment.tar.gz dist/ server/ package.json package-lock.json public/ .env.production 2>/dev/null || tar -czf vps-deployment.tar.gz dist/ server/ package.json package-lock.json public/');
    console.log('✅ Package oluşturuldu');

    // 2. VPS'e upload için komutları hazırla
    const uploadCmd = `
      scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null vps-deployment.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/
    `;

    const deployCmd = `
      ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${VPS_USER}@${VPS_HOST} '
        set -e
        echo "📂 Proje dizini hazırlanıyor..."
        mkdir -p ${VPS_PATH}
        cd ${VPS_PATH}

        if [ -d "dist" ]; then
          echo "💾 Eski dosyalar yedekleniyor..."
          tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz dist/ server/ 2>/dev/null || true
        fi

        echo "📦 Yeni dosyalar çıkartılıyor..."
        tar -xzf /tmp/vps-deployment.tar.gz
        rm /tmp/vps-deployment.tar.gz

        if ! command -v node &> /dev/null; then
          echo "📥 Node.js kuruluyor..."
          curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
          apt-get install -y nodejs
        fi

        echo "📦 Dependencies yükleniyor..."
        npm ci --production || npm install --production

        if ! command -v pm2 &> /dev/null; then
          echo "📥 PM2 kuruluyor..."
          npm install -g pm2
        fi

        echo "🚀 Backend başlatılıyor..."
        pm2 delete syncarch-backend 2>/dev/null || true
        pm2 start server/index.js --name syncarch-backend
        pm2 save

        if ! command -v nginx &> /dev/null; then
          echo "📥 Nginx kuruluyor..."
          apt-get update
          apt-get install -y nginx
        fi

        echo "⚙️ Nginx yapılandırılıyor..."
        cat > /etc/nginx/sites-available/syncarch << "NGINXEOF"
server {
    listen 80;
    server_name istakip.syncarch.com ${VPS_HOST};

    root ${VPS_PATH}/dist;
    index index.html;

    location / {
        try_files \\$uri \\$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
NGINXEOF

        ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default

        nginx -t && systemctl restart nginx

        echo ""
        echo "✅ DEPLOYMENT TAMAMLANDI!"
        echo "🌐 Site URL: http://istakip.syncarch.com"
        echo "📊 Backend durumu:"
        pm2 status
      '
    `;

    console.log('\n📤 Dosyalar VPS\'e yükleniyor...');
    console.log(`\nLütfen şu komutu manuel çalıştırın:\n`);
    console.log(`scp vps-deployment.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/`);
    console.log(`\nArdından VPS'te deployment için:\n`);
    console.log(`ssh ${VPS_USER}@${VPS_HOST}`);
    console.log(`\nVe VPS'te bu komutları çalıştırın:`);
    console.log(deployCmd.trim());

  } catch (error) {
    console.error(`\n❌ Deployment hatası: ${error.message}`);
    process.exit(1);
  }
}

deploy();
