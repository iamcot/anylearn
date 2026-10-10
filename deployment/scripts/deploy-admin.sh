#!/bin/bash
set -e

DEPLOY_PATH="/opt/anylearn/admin"
RELEASE_ID=$(date +%s)
RELEASE_PATH="${DEPLOY_PATH}/releases/release-${RELEASE_ID}"
BUILD_PATH="$1"

if [ -z "${BUILD_PATH}" ]; then
    echo "Usage: $0 <path-to-dist-directory>"
    echo "  (directory must be the Vite dist/ output)"
    exit 1
fi

if [ ! -d "${BUILD_PATH}" ]; then
    echo "✗ Build directory not found: ${BUILD_PATH}"
    exit 1
fi

if [ ! -f "${BUILD_PATH}/index.html" ]; then
    echo "✗ index.html not found in build directory — is this a Vite dist/ folder?"
    exit 1
fi

echo "Deploying admin release ${RELEASE_ID}..."

mkdir -p "${DEPLOY_PATH}/releases"
mkdir -p "${RELEASE_PATH}"

# Copy all built assets
cp -r "${BUILD_PATH}/." "${RELEASE_PATH}/"
echo "✓ Copied build artifacts"

# Fix ownership so nginx (www-data) can read files
sudo chown -R anylearn-app:anylearn-deploy "${RELEASE_PATH}"
sudo chmod -R a+rX "${RELEASE_PATH}"
echo "✓ Fixed ownership and permissions"

# Atomic symlink switch (nginx reads from current/)
ln -sfn "${RELEASE_PATH}" "${DEPLOY_PATH}/current"
echo "✓ Switched symlink to release ${RELEASE_ID}"

# Reload nginx to pick up the new symlink (no downtime)
sudo systemctl reload nginx
echo "✓ nginx reloaded"

echo "✓ Admin deployed successfully (release ${RELEASE_ID})"

# Cleanup: keep only last 5 releases
cd "${DEPLOY_PATH}/releases" && ls -t | tail -n +6 | xargs -r sudo rm -rf
echo "✓ Old releases cleaned up"
