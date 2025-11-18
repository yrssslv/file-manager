#!/bin/bash

set -e

if [ ! -d "dist" ]; then
    npm run build
fi

node dist/app.mjs
