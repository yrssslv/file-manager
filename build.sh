#!/bin/bash

echo "Building File Manager Executables"
echo ""

rm -rf build
mkdir -p build

echo "Installing dependencies..."
npm install

echo "Compiling TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Creating executables..."
npm run build:exe
if [ $? -ne 0 ]; then
    echo "Executable creation failed!"
    exit 1
fi

echo ""
echo "Build completed successfully!"
echo ""
ls -lh build/
echo ""
