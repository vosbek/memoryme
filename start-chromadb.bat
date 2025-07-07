@echo off
echo Starting ChromaDB server...

rem Check if Python is available
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

rem Install ChromaDB if not already installed
pip show chromadb >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing ChromaDB...
    pip install chromadb
)

rem Create data directory
if not exist "chromadb-data" mkdir "chromadb-data"

rem Start ChromaDB server
echo ChromaDB server starting on http://localhost:8001
echo Data will be stored in: %cd%\chromadb-data
echo.
echo Press Ctrl+C to stop the server
chroma run --path chromadb-data --port 8001