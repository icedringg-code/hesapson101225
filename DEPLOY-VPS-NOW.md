# 🚀 VPS Deployment - Hızlı Kurulum

## Otomatik Deployment (3 Adım)

### 1. Package Hazır ✅
`vps-deployment.tar.gz` dosyası oluşturuldu.

### 2. VPS'e Upload

```bash
scp vps-deployment.tar.gz root@31.97.78.86:/tmp/
```

Şifre: `00203549Rk..`

### 3. VPS'te Kurulum

SSH ile bağlanın:
```bash
ssh root@31.97.78.86
```

Şifre: `00203549Rk..`

Ardından bu komutları çalıştırın:

```bash
# Proje dizini hazırla
mkdir -p /var/www/syncarch-is-takip
cd /var/www/syncarch-is-takip

# Eski dosyaları yedekle (varsa)
[ -d "dist" ] && tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz dist/ server/ 2>/dev/null || true

# Yeni dosyaları çıkar
tar -xzf /tmp/vps-deployment.tar.gz
rm /tmp/vps-deployment.tar.gz

# Node.js kur (yoksa)
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Dependencies yükle
npm ci --production || npm install --production

# PM2 kur (yoksa)
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Backend'i başlat
pm2 delete syncarch-backend 2>/dev/null || true
pm2 start server/index.js --name syncarch-backend
pm2 save
pm2 startup

# Nginx kur (yoksa)
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
fi

# Nginx config oluştur
cat > /etc/nginx/sites-available/syncarch << 'EOF'
server {
    listen 80;
    server_name istakip.syncarch.com 31.97.78.86;

    root /var/www/syncarch-is-takip/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Nginx'i aktifleştir
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx test ve restart
nginx -t && systemctl restart nginx

echo ""
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo "🌐 Site: http://istakip.syncarch.com"
echo "🌐 IP: http://31.97.78.86"
echo ""
pm2 status
```

## ✅ Kurulum Tamamlandı!

Site şu adreslerde yayında olacak:
- http://istakip.syncarch.com
- http://31.97.78.86

## 🔒 SSL Sertifikası (İsteğe Bağlı)

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d istakip.syncarch.com
```

## 📊 Faydalı Komutlar

```bash
# Backend logları
pm2 logs syncarch-backend

# Backend restart
pm2 restart syncarch-backend

# Backend durumu
pm2 status

# Nginx logları
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Nginx restart
systemctl restart nginx

# Nginx durumu
systemctl status nginx
```

## 🔄 Güncelleme İçin

1. Yeni `vps-deployment.tar.gz` yükleyin
2. VPS'te:
```bash
cd /var/www/syncarch-is-takip
tar -xzf /tmp/vps-deployment.tar.gz
npm ci --production
pm2 restart syncarch-backend
```
