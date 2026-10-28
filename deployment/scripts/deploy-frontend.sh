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

# Install shared node_modules if not present or package.json changed
if [ ! -d "${DEPLOY_PATH}/node_modules" ] || \
   ! cmp -s "${BUILD_PATH}/package.json" "${DEPLOY_PATH}/package.json" 2>/dev/null; then
    echo "Installing shared node_modules..."
    cp "${BUILD_PATH}/package.json" "${DEPLOY_PATH}/"
    cp "${BUILD_PATH}/package-lock.json" "${DEPLOY_PATH}/" 2>/dev/null || true
    cd "${DEPLOY_PATH}" && nice -n 19 npm ci --prefer-offline --no-audit
    echo "✓ Shared node_modules installed"
fi

# Link to shared node_modules
ln -s "${DEPLOY_PATH}/node_modules" "${RELEASE_PATH}/node_modules"
echo "✓ Linked shared node_modules"

# Copy environment file
cp "${DEPLOY_PATH}/.env.production" "${RELEASE_PATH}/.env.production"
echo "✓ Copied .env.production"

# Fix ownership so anylearn-app service can read all files
sudo chown -R anylearn-app:anylearn-deploy "${RELEASE_PATH}"
echo "✓ Fixed ownership"

# Remember the release that is running now, so a failed start can go back to it
PREVIOUS_RELEASE=$(readlink "${DEPLOY_PATH}/current" 2>/dev/null || echo "")

wait_healthy() {
    local retries=$1
    for i in $(seq 1 "$retries"); do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
        if [ "$STATUS" = "200" ]; then
            return 0
        fi
        sleep 2
    done
    return 1
}

# Switch to the new release (the old process kept serving until this point)
ln -sfn "${RELEASE_PATH}" "${DEPLOY_PATH}/current"
echo "✓ Switched symlink to release ${RELEASE_ID}"

sudo systemctl reload-or-restart anylearn-frontend.service
echo "✓ Service restarted"

echo "Waiting for frontend to start..."
if wait_healthy 45; then
    echo "✓ Frontend is healthy"
else
    echo "✗ New frontend did not become healthy — keeping the old one"
    sudo journalctl -u anylearn-frontend.service -n 40 --no-pager 2>/dev/null || true
    if [ -n "${PREVIOUS_RELEASE}" ] && [ -d "${PREVIOUS_RELEASE}" ]; then
        ln -sfn "${PREVIOUS_RELEASE}" "${DEPLOY_PATH}/current"
        sudo systemctl reset-failed anylearn-frontend.service 2>/dev/null || true
        sudo systemctl restart anylearn-frontend.service || true
        echo "✓ Switched back to ${PREVIOUS_RELEASE}"
        wait_healthy 30 || echo "⚠ Old release is not healthy either — check the server"
    fi
    sudo rm -rf "${RELEASE_PATH}"
    exit 1
fi

echo "✓ Frontend deployed successfully (release ${RELEASE_ID})"

# Cleanup: keep only last 5 releases
cd "${DEPLOY_PATH}/releases" && ls -t | tail -n +6 | xargs -r sudo rm -rf
echo "✓ Old releases cleaned up"
