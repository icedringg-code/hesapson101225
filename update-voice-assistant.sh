#!/bin/bash

echo "========================================="
echo "  Ses Asistanı Güncellemesi Başlatılıyor"
echo "========================================="

cd /root/is-takip || exit 1

echo "✓ Yedekleme alınıyor..."
cp -r dist dist-backup-$(date +%Y%m%d-%H%M%S)

echo "✓ Yeni dosyalar indiriliyor..."
cat > dist-update.b64 << 'DISTFILE_END'
