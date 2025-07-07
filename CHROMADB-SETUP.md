# ChromaDB Setup Guide

## Quick Start

### Option 1: Run with ChromaDB (Full Features)
```powershell
# Install ChromaDB via Python (one-time setup)
pip install chromadb

# Run the full application with ChromaDB
npm run dev:full
```

### Option 2: Run without ChromaDB (Basic Features)
```powershell
# Run with legacy vector store (works without ChromaDB)
npm run dev
```

## Manual ChromaDB Setup

### Windows
```powershell
# Install Python 3.8+ if not already installed
# Install ChromaDB
pip install chromadb

# Start ChromaDB server (in a separate terminal)
.\start-chromadb.bat

# Then run the app (in another terminal)
npm run dev
```

### Linux/Mac
```bash
# Install Python 3.8+ if not already installed
# Install ChromaDB
pip install chromadb

# Start ChromaDB server (in a separate terminal)
./start-chromadb.sh

# Then run the app (in another terminal)
npm run dev
```

## Available Commands

- `npm run dev` - Run app with legacy vector store (no ChromaDB needed)
- `npm run dev:full` - Run app with ChromaDB server automatically started
- `npm run chromadb` - Start only the ChromaDB server
- `.\start-chromadb.bat` (Windows) - Manual ChromaDB server startup
- `./start-chromadb.sh` (Linux/Mac) - Manual ChromaDB server startup

## Features Comparison

| Feature | Legacy Mode | ChromaDB Mode |
|---------|------------|---------------|
| Memory Storage | ✅ SQLite | ✅ SQLite |
| Basic Search | ✅ Text search | ✅ Text search |
| Vector Search | ✅ Simple | ✅ Advanced HNSW |
| Performance | Good | Excellent |
| Semantic Search | Basic | Professional |
| Setup Complexity | None | Python + ChromaDB |

## Troubleshooting

### ChromaDB Connection Failed
- Ensure Python 3.8+ is installed
- Install ChromaDB: `pip install chromadb`
- Check if ChromaDB server is running on http://localhost:8000
- The app will automatically fall back to legacy mode if ChromaDB is unavailable

### Python Not Found
- Install Python from https://python.org
- Make sure Python is in your PATH
- Try `python --version` or `python3 --version`

## Data Storage

- **SQLite Database**: `%APPDATA%\devmemory\devmemory.db`
- **ChromaDB Data**: `chromadb-data/` folder in project directory
- **Legacy Vector Store**: `%APPDATA%\devmemory\vector-data.json`