# VPS Otomatik Deployment

## Yöntem 1: Python Script (Önerilen)

### Gereksinimler
```bash
# sshpass kurulumu
sudo apt-get install sshpass   # Ubuntu/Debian
brew install hudochenkov/sshpass/sshpass  # macOS
```

### Kullanım
```bash
python3 final-vps-deploy.py
```

---

## Yöntem 2: Manuel Base64 Yükleme (sshpass olmadan)

### Adımlar

1. **VPS'e bağlanın:**
```bash
ssh root@31.97.78.86
# Şifre: 00203549Rk..
```

2. **Dosyayı hazırlayın:**
```bash
cd /tmp
rm -f deploy.b64
```

3. **Base64 parçalarını ekleyin:**

Aşağıdaki komutları sırayla çalıştırın. Her komut bir parça ekler.

```bash
# Parça 1/9
cat >> deploy.b64 << 'PART1_END'
```
_(Burada chunk-aa içeriğini yapıştırın)_
```
PART1_END

# Parça 2/9
cat >> deploy.b64 << 'PART2_END'
```
_(Burada chunk-ab içeriğini yapıştırın)_
```
PART2_END

# ... devam eder (9 parçanın tamamı)
```

4. **Decode ve deploy:**
```bash
cd /var/www/syncarch.xyz
base64 -d /tmp/deploy.b64 > /tmp/deploy.tar.gz
rm /tmp/deploy.b64
tar -xzf /tmp/deploy.tar.gz
rm /tmp/deploy.tar.gz
chmod -R 755 /var/www/syncarch.xyz
systemctl restart nginx
ls -la
```

---

## Yöntem 3: Tek Komut (En Basit)

Lokalde şu komutu çalıştırın (şifre sorduğunda girin):

```bash
scp vps-deploy-latest.tar.gz root@31.97.78.86:/tmp/ && \
ssh root@31.97.78.86 "cd /var/www/syncarch.xyz && tar -xzf /tmp/vps-deploy-latest.tar.gz && rm /tmp/vps-deploy-latest.tar.gz && chmod -R 755 /var/www/syncarch.xyz && systemctl restart nginx && ls -la | head -20"
```

Şifre: `00203549Rk..`

---

## Sonuç

Tüm yöntemler sonunda şunu göreceksiniz:
- ✅ Dosyalar `/var/www/syncarch.xyz` dizinine extract edildi
- ✅ İzinler ayarlandı
- ✅ Nginx yeniden başlatıldı
- 🌐 Site: https://syncarch.xyz

## Sorun Giderme

### SSH bağlantı hatası
```bash
ssh-keygen -R 31.97.78.86
```

### Dosya bulunamadı
```bash
ls -la /tmp/vps-deploy-latest.tar.gz
```

### Nginx hatası
```bash
systemctl status nginx
journalctl -xeu nginx
```
