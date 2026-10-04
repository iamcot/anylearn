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

# Atomic symlink switch (zero downtime)
ln -sfn "${RELEASE_PATH}" "${DEPLOY_PATH}/current"
echo "✓ Switched symlink to release ${RELEASE_ID}"

# Restart service
sudo systemctl reload-or-restart anylearn-backend.service
echo "✓ Service restarted"

# Wait for service to be healthy
echo "Waiting for backend to start..."
RETRIES=30
for i in $(seq 1 $RETRIES); do
    if curl -sf http://localhost:8080/v2/api/config/homev2/buyer > /dev/null 2>&1; then
        echo "✓ Backend is healthy"
        break
    fi
    if [ "$i" -eq "$RETRIES" ]; then
        echo "✗ Backend health check failed after ${RETRIES} attempts"
        exit 1
    fi
    sleep 2
done

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
cd "${DEPLOY_PATH}/releases" && ls -t | tail -n +6 | xargs -r rm -rf
echo "✓ Old releases cleaned up"
