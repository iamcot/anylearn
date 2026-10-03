#!/bin/bash
set -e

echo "Installing anylearn nginx configuration..."

CONF_NAME="anylearn"
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"

# Copy both configs to sites-available
sudo cp deployment/nginx/anylearn.conf "${SITES_AVAILABLE}/${CONF_NAME}.conf"
sudo cp deployment/nginx/anylearn-php-fallback.conf "${SITES_AVAILABLE}/${CONF_NAME}-php-fallback.conf"
echo "✓ Copied configs to sites-available"

# Enable the main config (idempotent)
if [ ! -L "${SITES_ENABLED}/${CONF_NAME}.conf" ]; then
    sudo ln -s "${SITES_AVAILABLE}/${CONF_NAME}.conf" "${SITES_ENABLED}/${CONF_NAME}.conf"
    echo "✓ Enabled ${CONF_NAME}.conf"
else
    echo "ℹ ${CONF_NAME}.conf already enabled"
fi

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
echo "✓ nginx reloaded"
