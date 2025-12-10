# 🔑 VPS SSH Key Kurulum

## Durum

✅ Deployment paketi hazır (492KB)
✅ Auto-deploy scripti hazır
✅ SSH key oluşturuldu
❌ VPS'e SSH erişimi kurulamıyor

## Çözüm: SSH Key Ekleme

### Yöntem 1: Manuel SSH Key Ekleme (ÖNERİLEN)

1. **Kendi bilgisayarınızdan VPS'e bağlanın:**
   ```bash
   ssh root@31.97.78.86
   ```
   Şifre: `şifre00203549Rk..`

2. **authorized_keys'e ekleyin:**
   ```bash
   mkdir -p ~/.ssh
   echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGgfM8ZXEOEiavTVB1qWqu2/gOy6qb4YmFsB484kvmDQ deployment@syncarch" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   exit
   ```

3. **Deployment'ı başlatın:**
   ```bash
   ./auto-deploy-with-key.sh
   ```

### Yöntem 2: Hostinger Panel Üzerinden

Eğer Hostinger kullanıyorsanız:

1. **Hostinger Panel'e gidin**
   - https://hpanel.hostinger.com/vps

2. **SSH Keys bölümünü açın**

3. **Şu public key'i ekleyin:**
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGgfM8ZXEOEiavTVB1qWqu2/gOy6qb4YmFsB484kvmDQ deployment@syncarch
   ```

4. **Deployment'ı başlatın:**
   ```bash
   ./auto-deploy-with-key.sh
   ```

### Yöntem 3: Tek Seferde VPS Üzerinde Kurulum (MANUEL)

Eğer SSH key eklemek istemiyorsanız, doğrudan VPS'te kurulum yapabilirsiniz:

1. **Paketi VPS'e yükleyin (kendi bilgisayarınızdan):**
   ```bash
   scp syncarch-deploy.tar.gz root@31.97.78.86:/tmp/
   ```

2. **VPS'e bağlanın:**
   ```bash
   ssh root@31.97.78.86
   ```

3. **Kurulum komutlarını çalıştırın:**
   ```bash
   # Dizini hazırla
   mkdir -p /var/www/syncarch
   cd /var/www/syncarch

   # Yedek al
   if [ -f "index.html" ]; then
       mkdir -p backup
       cp -r * backup/ 2>/dev/null || true
   fi

   # Dosyaları çıkar
   tar -xzf /tmp/syncarch-deploy.tar.gz
   rm /tmp/syncarch-deploy.tar.gz

   # Dependencies kur
   npm install --production

   # PM2 başlat
   pm2 delete syncarch 2>/dev/null || true
   pm2 start server/index.js --name syncarch --time
   pm2 save
   pm2 startup systemd -u root --hp /root

   # Nginx yapılandır
   cat > /etc/nginx/sites-available/syncarch << 'NGINXCONF'
server {
    listen 80;
    server_name syncarch.xyz www.syncarch.xyz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name syncarch.xyz www.syncarch.xyz;

    ssl_certificate /etc/letsencrypt/live/syncarch.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/syncarch.xyz/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/syncarch;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXCONF

   ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx

   # Test
   pm2 status
   curl http://localhost:3001/health
   ```

## Hazırlanan Dosyalar

- ✅ `syncarch-deploy.tar.gz` - Deployment paketi (492KB)
- ✅ `auto-deploy.sh` - Otomatik deployment scripti
- ✅ `auto-deploy-with-key.sh` - SSH key ile deployment
- ✅ `setup-exchange-rates.sql` - Database migration

## Sonraki Adımlar

Yukarıdaki yöntemlerden birini seçip VPS'e erişimi sağladıktan sonra:

1. Deployment otomatik tamamlanacak
2. https://syncarch.xyz aktif olacak
3. Supabase'de SQL çalıştırmanız gerekecek

---

**Hangi yöntemi tercih ediyorsunuz?**
