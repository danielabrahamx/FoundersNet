#!/usr/bin/env bash
set -e

echo "Starting dependency installation..."

# Run npm ci but continue even if it fails
npm ci --foreground-scripts --loglevel=error 2>&1 || {
    echo "npm ci failed, trying npm install..."
    npm install --foreground-scripts --loglevel=error 2>&1
}

echo "Installation complete!"
echo "Checking node_modules/.bin..."
ls -la node_modules/.bin/ || echo ".bin directory not found"
