#!/bin/bash
set -e

DEPLOY_PATH="/opt/anylearn/backend"
RELEASE_ID=$(date +%s)
RELEASE_PATH="${DEPLOY_PATH}/releases/release-${RELEASE_ID}"
ARTIFACT_PATH="$1"

if [ -z "${ARTIFACT_PATH}" ]; then
    echo "Usage: $0 <path-to-backend-v2.jar>"
    exit 1
fi

if [ ! -f "${ARTIFACT_PATH}" ]; then
    echo "✗ Artifact not found: ${ARTIFACT_PATH}"
    exit 1
fi

echo "Deploying backend release ${RELEASE_ID}..."

# Create release directory
mkdir -p "${RELEASE_PATH}"

# Copy artifact and environment file
cp "${ARTIFACT_PATH}" "${RELEASE_PATH}/backend-v2.jar"
cp "${DEPLOY_PATH}/.env" "${RELEASE_PATH}/.env"
sudo chown -R anylearn-app:anylearn-deploy "${RELEASE_PATH}"
echo "✓ Copied artifact and env"

# Remember the release that is running now, so a failed start can go back to it
PREVIOUS_RELEASE=$(readlink "${DEPLOY_PATH}/current" 2>/dev/null || echo "")

rollback_to_previous() {
    echo "✗ New release did not become healthy — keeping the old one"
    sudo journalctl -u anylearn-backend.service -n 40 --no-pager 2>/dev/null || true
    if [ -n "${PREVIOUS_RELEASE}" ] && [ -d "${PREVIOUS_RELEASE}" ]; then
        ln -sfn "${PREVIOUS_RELEASE}" "${DEPLOY_PATH}/current"
        sudo systemctl reset-failed anylearn-backend.service 2>/dev/null || true
        sudo systemctl restart anylearn-backend.service || true
        echo "✓ Switched back to ${PREVIOUS_RELEASE}"
        wait_healthy 30 || echo "⚠ Old release is not healthy either — check the server"
    else
        echo "⚠ No previous release to go back to"
    fi
    # Drop the bad release so it is never taken for the "previous" one
    sudo rm -rf "${RELEASE_PATH}"
}

wait_healthy() {
    local retries=$1
    for i in $(seq 1 "$retries"); do
        if curl -sf http://localhost:8080/v2/api/config/homev2/buyer > /dev/null 2>&1; then
            return 0
        fi
        sleep 2
    done
    return 1
}

# Switch to the new release (the old process kept serving until this point)
ln -sfn "${RELEASE_PATH}" "${DEPLOY_PATH}/current"
echo "✓ Switched symlink to release ${RELEASE_ID}"

# Restart service
sudo systemctl reload-or-restart anylearn-backend.service
echo "✓ Service restarted"

# Only a release that answers the health check stays
echo "Waiting for backend to start..."
if wait_healthy 45; then
    echo "✓ Backend is healthy"
else
    rollback_to_previous
    exit 1
fi

# Trigger MeiliSearch reindex in background
ADMIN_TOKEN=$(grep "^ADMIN_API_TOKEN=" "${DEPLOY_PATH}/.env" | cut -d= -f2)
if [ -n "${ADMIN_TOKEN}" ]; then
    curl -s -X POST "http://localhost:8080/v2/admin/reindex?api_token=${ADMIN_TOKEN}" > /dev/null &
    curl -s -X POST "http://localhost:8080/v2/admin/reindex/users?api_token=${ADMIN_TOKEN}" > /dev/null &
    echo "✓ MeiliSearch reindex triggered (background)"
else
    echo "⚠ ADMIN_API_TOKEN not set — skipping reindex"
fi

echo "✓ Backend deployed successfully (release ${RELEASE_ID})"

# Cleanup: keep only last 5 releases
cd "${DEPLOY_PATH}/releases" && ls -t | tail -n +6 | xargs -r sudo rm -rf
echo "✓ Old releases cleaned up"
