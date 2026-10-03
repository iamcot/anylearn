#!/bin/bash
set -e

SERVICE=$1  # "backend" or "frontend"

if [ -z "$SERVICE" ]; then
    echo "Usage: $0 <backend|frontend>"
    exit 1
fi

if [ "$SERVICE" != "backend" ] && [ "$SERVICE" != "frontend" ]; then
    echo "✗ Invalid service: $SERVICE (must be 'backend' or 'frontend')"
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

# Restart service
sudo systemctl restart "anylearn-${SERVICE}.service"
echo "✓ Service restarted"

# Verify
sleep 5
if sudo systemctl is-active --quiet "anylearn-${SERVICE}.service"; then
    echo "✅ Rollback successful for ${SERVICE}"
else
    echo "✗ Service failed to start after rollback — check logs:"
    echo "  journalctl -u anylearn-${SERVICE}.service -n 50"
    exit 1
fi
