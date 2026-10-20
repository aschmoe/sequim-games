#!/usr/bin/env bash
# One-time server setup for Sequim Games. Run as root on the server:
#
#   bash setup-server.sh <domain> "<deploy public key>"
#
# It creates a limited `deploy` user that can only write /srv/sequim-games,
# adds an nginx site for <domain> next to the existing ones, and gets an HTTPS
# certificate with Certbot. Safe to re-run.
set -euo pipefail

DOMAIN=${1:?usage: setup-server.sh <domain> "<deploy public key>"}
PUBKEY=${2:?usage: setup-server.sh <domain> "<deploy public key>"}
APP=/srv/sequim-games
SITE=/etc/nginx/sites-available/sequim-games

case "$PUBKEY" in ssh-ed25519\ *|ssh-rsa\ *) ;; *) echo "That does not look like a public key (expected ssh-ed25519 ...)" >&2; exit 1 ;; esac

# 1. Deploy user, allowed in by the deploy key only
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
install -d -o deploy -g deploy -m 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
grep -qF "$PUBKEY" /home/deploy/.ssh/authorized_keys || echo "restrict $PUBKEY" >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
command -v rsync >/dev/null || apt-get install -y rsync

# 2. Release folders. `current` is a symlink to the live release.
install -d -o deploy -g deploy -m 755 "$APP" "$APP/releases"
if [ ! -e "$APP/current" ]; then
  install -d -o deploy -g deploy -m 755 "$APP/releases/initial"
  echo '<!doctype html><title>Sequim Games</title><p>Coming soon.</p>' > "$APP/releases/initial/index.html"
  chown deploy:deploy "$APP/releases/initial/index.html"
  ln -sfn releases/initial "$APP/current" && chown -h deploy:deploy "$APP/current"
fi

# 3. nginx site (left alone if it already exists, so Certbot's edits survive a re-run)
if [ ! -e "$SITE" ]; then
  cat > "$SITE" <<NGINX
server {
  listen 80;
  listen [::]:80;
  server_name $DOMAIN;

  root $APP/current;
  index index.html;

  # One page; /misha and /sebastian fall back to it. no-cache = always revalidate,
  # so a deploy shows up on the next load.
  location / {
    try_files \$uri \$uri/ /index.html;
    add_header Cache-Control "no-cache";
  }

  # Shared scoreboard API (added later)
  # location /api/ { proxy_pass http://127.0.0.1:3100; proxy_set_header X-Real-IP \$remote_addr; }
}
NGINX
fi
ln -sfn "$SITE" /etc/nginx/sites-enabled/sequim-games
nginx -t
systemctl reload nginx

# 4. HTTPS (needs the DNS record for $DOMAIN pointing at this server)
if getent hosts "$DOMAIN" >/dev/null; then
  certbot --nginx -d "$DOMAIN" --redirect
else
  echo "!! $DOMAIN does not resolve yet. Add the DNS A record, then run: certbot --nginx -d $DOMAIN --redirect"
fi

echo
echo "Done. Add these GitHub repo secrets (Settings > Secrets and variables > Actions):"
echo "  DEPLOY_HOST        = $DOMAIN"
echo "  DEPLOY_KNOWN_HOSTS = $DOMAIN $(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)"
echo "  DEPLOY_SSH_KEY     = the PRIVATE half of the deploy key"
