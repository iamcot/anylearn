#!/bin/bash
set -e

SERVICE=$1  # "backend", "frontend", or "admin"

if [ -z "$SERVICE" ]; then
    echo "Usage: $0 <backend|frontend|admin>"
    exit 1
fi

if [ "$SERVICE" != "backend" ] && [ "$SERVICE" != "frontend" ] && [ "$SERVICE" != "admin" ]; then
    echo "✗ Invalid service: $SERVICE (must be 'backend', 'frontend', or 'admin')"
    exit 1
fi

DEPLOY_PATH="/opt/anylearn/${SERVICE}"
CURRENT_RELEASE=$(readlink "${DEPLOY_PATH}/current" 2>/dev/null || echo "")
PREVIOUS_RELEASE=$(ls -t "${DEPLOY_PATH}/releases" 2>/dev/null | sed -n '2p')

if [ -z "${CURRENT_RELEASE}" ]; then
    echo "✗ No current release found for ${SERVICE}"
    exit 1
fi

if [ -z "${PREVIOUS_RELEASE}" ]; then
    echo "✗ No previous release found for ${SERVICE} — cannot rollback"
    exit 1
fi

echo "Rolling back ${SERVICE}..."
echo "  Current:  ${CURRENT_RELEASE}"
echo "  Previous: ${PREVIOUS_RELEASE}"

# Switch symlink to previous release
ln -sfn "${DEPLOY_PATH}/releases/${PREVIOUS_RELEASE}" "${DEPLOY_PATH}/current"
echo "✓ Symlink updated"

if [ "$SERVICE" = "admin" ]; then
    # Admin is static files — just reload nginx
    sudo systemctl reload nginx
    echo "✓ nginx reloaded"
    echo "✅ Rollback successful for admin"
else
    # backend/frontend have systemd services
    sudo systemctl restart "anylearn-${SERVICE}.service"
    echo "✓ Service restarted"

    sleep 5
    if sudo systemctl is-active --quiet "anylearn-${SERVICE}.service"; then
        echo "✅ Rollback successful for ${SERVICE}"
    else
        echo "✗ Service failed to start after rollback — check logs:"
        echo "  journalctl -u anylearn-${SERVICE}.service -n 50"
        exit 1
    fi
fi
