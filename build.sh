#!/bin/bash

set -e

echo "Building File Manager Executables"

if [ -d "build" ]; then
    rm -rf build
fi
mkdir -p build

echo "Installing dependencies..."
npm install

echo "Compiling TypeScript..."
npm run build

echo "Creating executables..."
npm run build:exe

echo "Build completed"
ls -lh build/

chmod +x build/file-manager-linux 2>/dev/null || true
chmod +x build/file-manager-macos 2>/dev/null || true
