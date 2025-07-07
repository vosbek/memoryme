#!/bin/bash
echo "Starting ChromaDB server..."

# Check if Python is available
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "Error: Python is not installed or not in PATH"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

# Install ChromaDB if not already installed
if ! $PYTHON_CMD -c "import chromadb" &> /dev/null; then
    echo "Installing ChromaDB..."
    pip install chromadb
fi

# Create data directory
mkdir -p chromadb-data

# Start ChromaDB server
echo "ChromaDB server starting on http://localhost:8001"
echo "Data will be stored in: $(pwd)/chromadb-data"
echo ""
echo "Press Ctrl+C to stop the server"
chroma run --path chromadb-data --port 8001