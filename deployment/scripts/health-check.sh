#!/bin/bash
set -e

RETRIES=30
SLEEP=2

# Backend health check
echo "Checking backend (http://localhost:8080/v2/api/config/homev2/buyer)..."
for i in $(seq 1 $RETRIES); do
    if curl -sf http://localhost:8080/v2/api/config/homev2/buyer > /dev/null 2>&1; then
        echo "✓ Backend healthy"
        break
    fi
    if [ "$i" -eq "$RETRIES" ]; then
        echo "✗ Backend health check FAILED after ${RETRIES} attempts"
        exit 1
    fi
    echo "  attempt $i/$RETRIES..."
    sleep $SLEEP
done

# Frontend health check
echo "Checking frontend (http://localhost:3000)..."
for i in $(seq 1 $RETRIES); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
        echo "✓ Frontend healthy (HTTP 200)"
        break
    fi
    if [ "$i" -eq "$RETRIES" ]; then
        echo "✗ Frontend health check FAILED after ${RETRIES} attempts (last: HTTP ${STATUS})"
        exit 1
    fi
    echo "  attempt $i/$RETRIES (HTTP ${STATUS})..."
    sleep $SLEEP
done

echo "✅ All services healthy"
