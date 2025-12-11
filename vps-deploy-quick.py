#!/usr/bin/env python3
import paramiko
import os
import sys

host = "31.97.78.86"
username = "root"
password = "00203549Rk.."
local_file = "dist-update.tar.gz"
remote_file = "/tmp/dist-update.tar.gz"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print("Connecting to VPS...")
    client.connect(host, username=username, password=password)

    print("Uploading file...")
    sftp = client.open_sftp()
    sftp.put(local_file, remote_file)
    sftp.close()
    print("File uploaded successfully!")

    print("Deploying...")
    commands = [
        "cd /var/www/syncarch",
        "rm -rf dist",
        "mkdir -p dist",
        "cd dist",
        "tar -xzf /tmp/dist-update.tar.gz",
        "ls -la assets/ | grep index",
        "rm /tmp/dist-update.tar.gz",
        "chown -R www-data:www-data /var/www/syncarch/dist",
        "chmod -R 755 /var/www/syncarch/dist",
        "systemctl reload nginx",
        "echo 'DEPLOYMENT COMPLETE'"
    ]

    for cmd in commands:
        stdin, stdout, stderr = client.exec_command(cmd)
        output = stdout.read().decode()
        if output:
            print(output.strip())

    client.close()
    print("✅ Deployment successful!")

except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
