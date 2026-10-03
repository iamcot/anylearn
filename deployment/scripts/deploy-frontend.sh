#!/bin/bash
set -e

DEPLOY_PATH="/opt/anylearn/frontend"
RELEASE_ID=$(date +%s)
RELEASE_PATH="${DEPLOY_PATH}/releases/release-${RELEASE_ID}"
BUILD_PATH="$1"

if [ -z "${BUILD_PATH}" ]; then
    echo "Usage: $0 <path-to-build-directory>"
    echo "  (directory must contain .next/, package.json, next.config.ts, public/)"
    exit 1
fi

if [ ! -d "${BUILD_PATH}" ]; then
    echo "✗ Build directory not found: ${BUILD_PATH}"
    exit 1
fi

echo "Deploying frontend release ${RELEASE_ID}..."

# Create release directory
mkdir -p "${RELEASE_PATH}"

# Copy build artifacts
cp -r "${BUILD_PATH}/.next"        "${RELEASE_PATH}/"
cp    "${BUILD_PATH}/package.json"  "${RELEASE_PATH}/"
cp    "${BUILD_PATH}/next.config.ts" "${RELEASE_PATH}/" 2>/dev/null || true
cp    "${BUILD_PATH}/next.config.js" "${RELEASE_PATH}/" 2>/dev/null || true
cp -r "${BUILD_PATH}/public"        "${RELEASE_PATH}/" 2>/dev/null || true
echo "✓ Copied build artifacts"

# Link to shared node_modules (installed once in DEPLOY_PATH)
ln -s "${DEPLOY_PATH}/node_modules" "${RELEASE_PATH}/node_modules"
echo "✓ Linked shared node_modules"

# Copy environment file
cp "${DEPLOY_PATH}/.env.production" "${RELEASE_PATH}/.env.production"
echo "✓ Copied .env.production"

# Atomic symlink switch (zero downtime)
ln -sfn "${RELEASE_PATH}" "${DEPLOY_PATH}/current"
echo "✓ Switched symlink to release ${RELEASE_ID}"

# Restart service
sudo systemctl reload-or-restart anylearn-frontend.service
echo "✓ Service restarted"

# Wait for frontend to be healthy
echo "Waiting for frontend to start..."
RETRIES=30
for i in $(seq 1 $RETRIES); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    if [ "$STATUS" = "200" ]; then
        echo "✓ Frontend is healthy (HTTP 200)"
        break
    fi
    if [ "$i" -eq "$RETRIES" ]; then
        echo "✗ Frontend health check failed after ${RETRIES} attempts (last status: ${STATUS})"
        exit 1
    fi
    sleep 2
done

echo "✓ Frontend deployed successfully (release ${RELEASE_ID})"

# Cleanup: keep only last 5 releases
cd "${DEPLOY_PATH}/releases" && ls -t | tail -n +6 | xargs -r rm -rf
echo "✓ Old releases cleaned up"
