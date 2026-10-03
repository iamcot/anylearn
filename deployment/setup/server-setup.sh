#!/bin/bash
# One-time server setup for anyLEARN deployment.
# Run once on a fresh server: sudo bash deployment/setup/server-setup.sh
set -e

echo "=========================================="
echo "  anyLEARN Server Setup"
echo "=========================================="

# ── Part 1: Install dependencies ──────────────────────────────────────────────

echo ""
echo "▶ Checking / installing dependencies..."

# Java 21
if java -version 2>&1 | grep -q '"21\.'; then
    echo "  ✓ Java 21 already installed"
else
    echo "  Installing Java 21..."
    sudo apt-get update -qq
    sudo apt-get install -y openjdk-21-jdk
    echo "  ✓ Java 21 installed"
fi

# Node 20
if node --version 2>/dev/null | grep -qE '^v(20|22)\.'; then
    echo "  ✓ Node $(node --version) already installed"
else
    echo "  Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null
    sudo apt-get install -y nodejs > /dev/null
    echo "  ✓ Node $(node --version) installed"
fi

# Docker (for MeiliSearch)
if command -v docker &>/dev/null; then
    echo "  ✓ Docker already installed ($(docker --version | cut -d' ' -f3 | tr -d ','))"
else
    echo "  Installing Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -qq
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin
    sudo usermod -aG docker "${SUDO_USER:-$USER}" 2>/dev/null || true
    echo "  ✓ Docker installed"
    echo "  ⚠ Log out and back in for Docker group to take effect (or use 'newgrp docker')"
fi

# ── Part 2: Create app user and group ─────────────────────────────────────────

echo ""
echo "▶ Setting up users and groups..."

if ! getent group anylearn-deploy &>/dev/null; then
    sudo groupadd anylearn-deploy
    echo "  ✓ Created anylearn-deploy group"
fi

if ! id "anylearn-app" &>/dev/null; then
    sudo useradd -r -s /bin/bash -m -d /opt/anylearn -G anylearn-deploy anylearn-app
    echo "  ✓ Created anylearn-app user"
else
    sudo usermod -a -G anylearn-deploy anylearn-app 2>/dev/null || true
    echo "  ✓ anylearn-app already exists"
fi

# Add the runner user to deployment group
RUNNER_USER="${SUDO_USER:-$USER}"
if ! groups "$RUNNER_USER" 2>/dev/null | grep -q anylearn-deploy; then
    sudo usermod -a -G anylearn-deploy "$RUNNER_USER"
    echo "  ✓ Added $RUNNER_USER to anylearn-deploy group"
fi

# ── Part 3: Create directory structure ────────────────────────────────────────

echo ""
echo "▶ Creating directory structure..."

sudo mkdir -p /opt/anylearn/{backend,frontend}/{releases,logs}
sudo mkdir -p /opt/anylearn/meilisearch
sudo mkdir -p /opt/anylearn/scripts
echo "  ✓ Created /opt/anylearn directory tree"

# Set ownership and permissions
sudo chown -R anylearn-app:anylearn-deploy /opt/anylearn
sudo chmod -R 775 /opt/anylearn
# Setgid so new files inherit group
sudo chmod g+s /opt/anylearn /opt/anylearn/backend /opt/anylearn/frontend
echo "  ✓ Set ownership and permissions"

# ── Part 4: Copy deployment scripts ───────────────────────────────────────────

echo ""
echo "▶ Installing deployment scripts..."

sudo cp deployment/scripts/*.sh /opt/anylearn/scripts/
sudo chmod +x /opt/anylearn/scripts/*.sh
sudo chown anylearn-app:anylearn-deploy /opt/anylearn/scripts/*.sh
echo "  ✓ Scripts installed to /opt/anylearn/scripts/"

# ── Part 5: Install systemd services ─────────────────────────────────────────

echo ""
echo "▶ Installing systemd services..."

sudo cp deployment/systemd/anylearn-backend.service /etc/systemd/system/
sudo cp deployment/systemd/anylearn-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable anylearn-backend.service
sudo systemctl enable anylearn-frontend.service
echo "  ✓ Systemd services installed and enabled"

# ── Part 6: Configure sudo permissions ───────────────────────────────────────

echo ""
echo "▶ Configuring sudo permissions..."

cat << 'SUDOERS' | sudo tee /etc/sudoers.d/anylearn-deploy > /dev/null
anylearn-app ALL=(ALL) NOPASSWD: /bin/systemctl reload-or-restart anylearn-backend.service
anylearn-app ALL=(ALL) NOPASSWD: /bin/systemctl reload-or-restart anylearn-frontend.service
anylearn-app ALL=(ALL) NOPASSWD: /bin/systemctl restart anylearn-backend.service
anylearn-app ALL=(ALL) NOPASSWD: /bin/systemctl restart anylearn-frontend.service
anylearn-app ALL=(ALL) NOPASSWD: /bin/systemctl is-active anylearn-backend.service
anylearn-app ALL=(ALL) NOPASSWD: /bin/systemctl is-active anylearn-frontend.service
SUDOERS

sudo chmod 0440 /etc/sudoers.d/anylearn-deploy
echo "  ✓ Sudo permissions configured"

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo "=========================================="
echo "  ✅ Server setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Setup MeiliSearch:"
echo "   cp docker-compose.yml /opt/anylearn/meilisearch/"
echo "   cp deployment/env/meilisearch.env.example /opt/anylearn/meilisearch/.env"
echo "   nano /opt/anylearn/meilisearch/.env    # set MEILI_MASTER_KEY"
echo "   cd /opt/anylearn/meilisearch && docker compose up -d"
echo ""
echo "2. Create backend env file:"
echo "   cp deployment/env/backend.env.example /opt/anylearn/backend/.env"
echo "   nano /opt/anylearn/backend/.env        # fill all values"
echo ""
echo "3. Create frontend env file:"
echo "   cp deployment/env/frontend.env.example /opt/anylearn/frontend/.env.production"
echo "   nano /opt/anylearn/frontend/.env.production"
echo ""
echo "4. Install nginx config:"
echo "   bash deployment/nginx/install-nginx.sh"
echo ""
echo "5. Deploy backend (build locally first):"
echo "   bash deployment/scripts/deploy-backend.sh /path/to/backend-v2.jar"
echo ""
echo "6. Install Node.js dependencies (first time only):"
echo "   cd /opt/anylearn/frontend && npm install --production"
echo ""
echo "7. Deploy frontend (npm run build locally first):"
echo "   bash deployment/scripts/deploy-frontend.sh /path/to/build-dir"
echo ""
echo "8. Verify:"
echo "   bash deployment/scripts/health-check.sh"
