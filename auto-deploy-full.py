#!/usr/bin/env python3
import os
import subprocess
import time
import sys

VPS_HOST = "31.97.78.86"
VPS_USER = "root"
VPS_PASSWORD = "00203549Rk.."
DOMAIN = "syncarch.xyz"

def run_command(cmd, cwd=None):
    """Run command and return output"""
    print(f"🔧 Running: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Error: {result.stderr}")
        return None
    return result.stdout

def create_deployment_package():
    """Create tar.gz and base64 from dist folder"""
    print("\n📦 Creating deployment package...")

    # Create tar.gz
    run_command("tar -czf dist.tar.gz -C dist .")

    # Convert to base64
    if os.name == 'nt':  # Windows
        run_command("certutil -encode dist.tar.gz dist.b64")
        # Clean up certutil headers
        with open("dist.b64", "r") as f:
            lines = f.readlines()
        with open("dist.b64", "w") as f:
            f.writelines(lines[1:-1])
    else:  # Linux/Mac
        run_command("base64 dist.tar.gz > dist.b64")

    print("✅ Package created: dist.b64")

def upload_to_vps():
    """Upload and deploy to VPS"""
    print("\n🚀 Uploading to VPS...")

    # Read base64 content
    with open("dist.b64", "r") as f:
        base64_content = f.read().strip()

    # VPS commands
    vps_commands = f"""
# Upload base64 content
cat > /tmp/dist.b64 << 'EOFBASE64'
{base64_content}
EOFBASE64

# Decode and extract
base64 -d /tmp/dist.b64 > /tmp/dist.tar.gz
mkdir -p /tmp/syncarch-new
tar -xzf /tmp/dist.tar.gz -C /tmp/syncarch-new

# Install nginx if not exists
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
fi

# Backup and deploy
mkdir -p /var/www/backup
if [ -d /var/www/{DOMAIN} ]; then
    cp -r /var/www/{DOMAIN} /var/www/backup/syncarch-$(date +%Y%m%d-%H%M%S)
fi

# Move new files
rm -rf /var/www/{DOMAIN}
mkdir -p /var/www/{DOMAIN}
mv /tmp/syncarch-new/* /var/www/{DOMAIN}/
rmdir /tmp/syncarch-new

# Set permissions
chmod -R 755 /var/www/{DOMAIN}
chown -R www-data:www-data /var/www/{DOMAIN}

# Create nginx config
cat > /etc/nginx/sites-available/{DOMAIN} << 'EOFNGINX'
server {{
    listen 80;
    listen [::]:80;
    server_name {DOMAIN} www.{DOMAIN};
    root /var/www/{DOMAIN};
    index index.html;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {{
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}
}}
EOFNGINX

# Enable site
ln -sf /etc/nginx/sites-available/{DOMAIN} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
nginx -t && systemctl restart nginx

# Install certbot for HTTPS
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
certbot --nginx -d {DOMAIN} -d www.{DOMAIN} --non-interactive --agree-tos --email admin@{DOMAIN} --redirect

# Cleanup
rm -f /tmp/dist.*

echo ""
echo "✅ Deployment completed!"
echo "🌐 Site: https://{DOMAIN}"
echo "📁 Path: /var/www/{DOMAIN}"
echo ""
ls -lh /var/www/{DOMAIN}
"""

    # Create expect script for SSH with password
    expect_script = f"""#!/usr/bin/expect -f
set timeout -1
spawn ssh -o StrictHostKeyChecking=no {VPS_USER}@{VPS_HOST}
expect "password:"
send "{VPS_PASSWORD}\\r"
expect "# "
send "{vps_commands.replace('"', '\\"').replace('$', '\\$')}\\r"
expect "# "
send "exit\\r"
expect eof
"""

    # Try using sshpass (simpler)
    print("🔐 Connecting to VPS...")

    # Check if sshpass is available
    if run_command("which sshpass") or run_command("where sshpass"):
        # Use sshpass
        commands_file = "/tmp/vps_commands.sh"
        with open(commands_file, "w") as f:
            f.write(vps_commands)

        cmd = f'sshpass -p "{VPS_PASSWORD}" ssh -o StrictHostKeyChecking=no {VPS_USER}@{VPS_HOST} "bash -s" < {commands_file}'
        result = run_command(cmd)
        if result:
            print(result)
    else:
        print("\n⚠️  sshpass not found. Please install it:")
        print("  Windows: Download from https://sourceforge.net/projects/sshpass/")
        print("  Mac: brew install hudochenkov/sshpass/sshpass")
        print("  Linux: sudo apt-get install sshpass")
        print("\nOr run these commands manually on VPS:\n")
        print(vps_commands)

        # Save commands to file for manual execution
        with open("vps-manual-commands.sh", "w") as f:
            f.write(vps_commands)
        print("\n📝 Commands saved to: vps-manual-commands.sh")
        return False

    return True

def main():
    print("=" * 60)
    print("🚀 SyncArch Automatic VPS Deployment")
    print("=" * 60)
    print(f"🌐 Domain: {DOMAIN}")
    print(f"🖥️  VPS: {VPS_HOST}")
    print("=" * 60)

    # Create package
    create_deployment_package()

    # Upload
    if upload_to_vps():
        print("\n" + "=" * 60)
        print("✅ DEPLOYMENT SUCCESSFUL!")
        print("=" * 60)
        print(f"🌐 Your site is live at: https://{DOMAIN}")
        print("🔒 HTTPS is enabled")
        print("=" * 60)
    else:
        print("\n⚠️  Please complete deployment manually using saved commands")

if __name__ == "__main__":
    main()
