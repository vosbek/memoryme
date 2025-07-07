#!/bin/bash
echo "Copying SQL.js WASM files to dist directory..."

# Create the dist directory structure
mkdir -p dist/sql.js/dist

# Copy all WASM files
cp node_modules/sql.js/dist/*.wasm dist/sql.js/dist/

echo "WASM files copied successfully!"
echo "Files copied to: dist/sql.js/dist/"