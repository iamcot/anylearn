#!/bin/bash
# EMERGENCY ROLLBACK — Switch toàn bộ / về PHP portal
# Dùng khi Next.js frontend có lỗi nghiêm trọng không sửa nhanh được.
# Java backend (/v2/) vẫn tiếp tục chạy bình thường.

set -e

SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"
CONF_NAME="anylearn"

echo "⚠️  EMERGENCY: Switching frontend to PHP..."

# Test fallback config trước
sudo nginx -t -c "/dev/stdin" << EOF 2>/dev/null || true
include ${SITES_AVAILABLE}/${CONF_NAME}-php-fallback.conf;
EOF

# Overwrite symlink với PHP fallback config
sudo cp "${SITES_AVAILABLE}/${CONF_NAME}-php-fallback.conf" \
        "${SITES_ENABLED}/${CONF_NAME}.conf"

sudo nginx -t
sudo systemctl reload nginx

echo "✅ Rolled back to PHP frontend"
echo ""
echo "Verify: curl -I https://anylearn.vn/"
echo ""
echo "To restore Next.js frontend:"
echo "  sudo cp ${SITES_AVAILABLE}/${CONF_NAME}.conf ${SITES_ENABLED}/${CONF_NAME}.conf"
echo "  sudo systemctl reload nginx"
