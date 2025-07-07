# DevMemory VS Code Extension Installation

## Install from VSIX Package

### Option 1: Command Line Installation
```bash
code --install-extension dist/devmemory-vscode-1.0.0.vsix
```

### Option 2: VS Code UI Installation
1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the Command Palette
3. Type "Extensions: Install from VSIX..."
4. Navigate to and select the `dist/devmemory-vscode-1.0.0.vsix` file
5. Click "Install"

### Option 3: Extensions View Installation
1. Open VS Code
2. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Click the "..." menu at the top of the Extensions view
4. Select "Install from VSIX..."
5. Navigate to and select the `dist/devmemory-vscode-1.0.0.vsix` file

## Usage

After installation:
1. Press `Ctrl+Alt+M` (or `Cmd+Alt+M` on Mac) to open the DevMemory floating panel
2. The panel opens as a standalone floating window with its own title bar
3. Use the three tabs: Capture, Search, and Recent to manage your development memories

## Features

- **Floating Window**: Independent panel that doesn't interfere with VS Code's sidebar
- **Custom Title Bar**: Minimize, maximize, and close buttons for window management
- **Memory Capture**: Save code snippets, notes, and documentation with metadata
- **Search**: Find memories using keywords and content search
- **Recent Memories**: Quick access to your latest captured memories
- **Auto-fill**: Automatically captures selected text and file context

## Requirements

- VS Code version 1.80.0 or higher
- DevMemory backend service running (for full functionality)

## Troubleshooting

If the extension doesn't load:
1. Restart VS Code after installation
2. Check that your VS Code version meets the requirements
3. Ensure the DevMemory backend service is running and accessible

## Uninstallation

To remove the extension:
1. Go to Extensions view (`Ctrl+Shift+X`)
2. Find "DevMemory" in your installed extensions
3. Click the gear icon and select "Uninstall"

## Development

To build from source:
```bash
cd vscode-extension
npm install
npm run compile
npm run package
```

This will create a new `.vsix` file that you can install using the methods above.