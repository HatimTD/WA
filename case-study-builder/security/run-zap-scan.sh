#!/bin/bash
# OWASP ZAP Security Scan Script
# Run this script to perform DAST (Dynamic Application Security Testing)
#
# Prerequisites:
# - Docker installed and running
# - Application running on localhost:3000
#
# Usage: ./security/run-zap-scan.sh [baseline|full|api]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$PROJECT_DIR/security/reports"
TARGET_URL="${TARGET_URL:-http://host.docker.internal:3000}"

# Create reports directory
mkdir -p "$REPORT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}OWASP ZAP Security Scanner${NC}"
echo -e "${GREEN}Case Study Builder${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if target is accessible
echo -e "${YELLOW}Checking if target is accessible...${NC}"
if ! curl -s --head "$TARGET_URL" > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Cannot reach $TARGET_URL${NC}"
    echo -e "${YELLOW}Make sure the application is running: npm run dev${NC}"
fi

SCAN_TYPE="${1:-baseline}"

case "$SCAN_TYPE" in
    "baseline")
        echo -e "${YELLOW}Running Baseline Scan (passive only)...${NC}"
        docker run --rm \
            --add-host=host.docker.internal:host-gateway \
            -v "$REPORT_DIR:/zap/wrk/:rw" \
            -t ghcr.io/zaproxy/zaproxy:stable \
            zap-baseline.py \
            -t "$TARGET_URL" \
            -g gen.conf \
            -r zap-baseline-report.html \
            -J zap-baseline-report.json \
            -I
        ;;

    "full")
        echo -e "${YELLOW}Running Full Active Scan (may take 30+ minutes)...${NC}"
        docker run --rm \
            --add-host=host.docker.internal:host-gateway \
            -v "$REPORT_DIR:/zap/wrk/:rw" \
            -t ghcr.io/zaproxy/zaproxy:stable \
            zap-full-scan.py \
            -t "$TARGET_URL" \
            -g gen.conf \
            -r zap-full-report.html \
            -J zap-full-report.json \
            -m 30 \
            -I
        ;;

    "api")
        echo -e "${YELLOW}Running API Scan...${NC}"
        # First, generate OpenAPI spec if available
        docker run --rm \
            --add-host=host.docker.internal:host-gateway \
            -v "$REPORT_DIR:/zap/wrk/:rw" \
            -t ghcr.io/zaproxy/zaproxy:stable \
            zap-api-scan.py \
            -t "$TARGET_URL/api" \
            -f openapi \
            -r zap-api-report.html \
            -J zap-api-report.json \
            -I
        ;;

    "custom")
        echo -e "${YELLOW}Running Custom Scan with configuration...${NC}"
        docker run --rm \
            --add-host=host.docker.internal:host-gateway \
            -v "$PROJECT_DIR/security:/zap/wrk/:rw" \
            -t ghcr.io/zaproxy/zaproxy:stable \
            zap.sh -cmd \
            -autorun /zap/wrk/zap-config.yaml
        ;;

    *)
        echo -e "${RED}Unknown scan type: $SCAN_TYPE${NC}"
        echo "Usage: $0 [baseline|full|api|custom]"
        exit 1
        ;;
esac

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Scan Complete!${NC}"
echo -e "${GREEN}Reports saved to: $REPORT_DIR${NC}"
echo -e "${GREEN}========================================${NC}"

# Check for critical findings
if [ -f "$REPORT_DIR/zap-${SCAN_TYPE}-report.json" ]; then
    CRITICAL_COUNT=$(jq '[.site[].alerts[] | select(.riskcode == "3")] | length' "$REPORT_DIR/zap-${SCAN_TYPE}-report.json" 2>/dev/null || echo "0")
    HIGH_COUNT=$(jq '[.site[].alerts[] | select(.riskcode == "2")] | length' "$REPORT_DIR/zap-${SCAN_TYPE}-report.json" 2>/dev/null || echo "0")

    echo -e "${YELLOW}Summary:${NC}"
    echo -e "  Critical: $CRITICAL_COUNT"
    echo -e "  High: $HIGH_COUNT"

    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo -e "${RED}WARNING: Critical vulnerabilities found!${NC}"
        exit 1
    fi
fi

exit 0
