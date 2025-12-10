# VPS Sesli Asistan Kurulum Talimatları

Bu talimatlar, sesli asistan özelliğini VPS'nizde çalıştırmak için gerekli adımları içerir.

## 1. Gerekli Paketleri Yükleyin

VPS'nizde proje klasörüne gidin ve paketleri yükleyin:

```bash
cd /path/to/your/project
npm install
```

## 2. .env Dosyasını Yapılandırın

VPS'nizdeki `.env` dosyasını düzenleyin:

```bash
nano .env
```

Aşağıdaki satırları ekleyin/güncelleyin:

```
# Supabase ayarları (zaten mevcut)
VITE_SUPABASE_ANON_KEY=your_existing_key
VITE_SUPABASE_URL=your_existing_url

# API URL - VPS production için
VITE_API_URL=https://your-domain.com

# OpenAI API Key - BU ÖNEMLİ!
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Backend port
PORT=3001
```

**Önemli:** `OPENAI_API_KEY` değerini gerçek OpenAI API key'inizle değiştirin!

## 3. PM2 ile Backend Sunucusunu Başlatın

Backend sunucusunu arka planda sürekli çalışır hale getirin:

```bash
# PM2'yi global olarak yükleyin (henüz yüklü değilse)
sudo npm install -g pm2

# Backend sunucusunu başlatın
pm2 start server/index.js --name "voice-assistant-api"

# Sistem yeniden başladığında otomatik başlaması için
pm2 startup
pm2 save
```

## 4. Nginx Yapılandırması

Backend API'yi frontend ile birlikte sunmak için Nginx'i yapılandırın:

```bash
sudo nano /etc/nginx/sites-available/your-site
```

Aşağıdaki yapılandırmayı ekleyin:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (dist klasörü)
    location / {
        root /path/to/your/project/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Büyük dosyalar için (ses kayıtları)
        client_max_body_size 10M;
    }
}
```

Nginx'i yeniden başlatın:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 5. Frontend'i Build Edin

VPS'nizde projeyi build edin:

```bash
npm run build
```

## 6. Servis Durumunu Kontrol Edin

```bash
# Backend API durumu
pm2 status
pm2 logs voice-assistant-api

# Nginx durumu
sudo systemctl status nginx
```

## 7. Test Edin

Tarayıcınızda sitenizi açın ve sağ alttaki mikrofon butonunu test edin:

1. Mikrofon butonuna tıklayın
2. Tarayıcı mikrofon izni isteyecek - izin verin
3. Bir komut söyleyin (örn: "ABC firmasından 5000 lira tahsilat yap")
4. Butona tekrar tıklayıp kaydı durdurun
5. Sistem komutu işleyecek ve sonucu gösterecek

## Sorun Giderme

### Backend çalışmıyor
```bash
pm2 logs voice-assistant-api
```

### API'ye erişilemiyor
```bash
# Port 3001'in açık olduğunu kontrol edin
sudo netstat -tlnp | grep 3001

# Nginx loglarını kontrol edin
sudo tail -f /var/log/nginx/error.log
```

### OpenAI API hatası
- `.env` dosyasında `OPENAI_API_KEY` değerinin doğru olduğundan emin olun
- OpenAI hesabınızda kredi olduğunu kontrol edin
- PM2'yi yeniden başlatın: `pm2 restart voice-assistant-api`

## Güvenlik Notları

1. `.env` dosyasının izinlerini kısıtlayın:
   ```bash
   chmod 600 .env
   ```

2. OpenAI API key'inizi asla public repository'ye commit etmeyin

3. SSL sertifikası yükleyerek HTTPS kullanın (Let's Encrypt önerilir)

## Güncelleme

Yeni değişiklikler yüklendiğinde:

```bash
# Kodu güncelleyin
git pull

# Paketleri güncelleyin
npm install

# Frontend'i yeniden build edin
npm run build

# Backend'i yeniden başlatın
pm2 restart voice-assistant-api
```
