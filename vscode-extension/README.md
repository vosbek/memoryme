# DevMemory VSCode Extension

Capture and search your development memories directly from VSCode! This extension integrates with the DevMemory desktop application to provide seamless knowledge management for developers.

## Features

### 🚀 **Quick Capture**
- **Capture Code Snippets**: Select code and press `Ctrl+Shift+M` to capture it as a memory
- **Capture Entire Files**: Use the command palette or editor menu to capture complete files
- **Auto-metadata**: Automatically captures file name, language, project context, and timestamp

### 🔍 **Smart Search**
- **Instant Search**: Press `Ctrl+Shift+F` to search your memories
- **Semantic Search**: Leverages the same vector database as the desktop app
- **Quick Insert**: Search and insert memories directly into your code

### 📋 **Quick Capture Panel**
- **Interactive Interface**: Press `Ctrl+Alt+M` to open the quick capture panel
- **Rich Metadata**: Add titles, tags, project info, and custom metadata
- **Recent Memories**: Browse and insert recent captures

### 🌲 **Explorer Integration**
- **Memory Tree View**: Browse memories by type, tags, and recency
- **One-click Actions**: View, edit, and insert memories from the explorer
- **Visual Organization**: Icons and grouping for easy navigation

## Installation

### Prerequisites
1. **DevMemory Desktop App**: Install the main DevMemory application first
2. **VSCode**: Version 1.80.0 or higher

### Install Extension
1. Download the `.vsix` file from releases
2. Open VSCode
3. Go to Extensions view (`Ctrl+Shift+X`)
4. Click the "..." menu and select "Install from VSIX..."
5. Select the downloaded `.vsix` file

### Configuration
1. Open VSCode Settings (`Ctrl+,`)
2. Search for "DevMemory"
3. Configure the extension settings:
   - **App Path**: Path to your DevMemory executable
   - **Auto Capture**: Enable automatic capture on copy operations
   - **Capture Commands**: Automatically capture terminal commands
   - **Capture Files**: Automatically capture file changes

## Usage

### Keyboard Shortcuts
- `Ctrl+Shift+M` (Mac: `Cmd+Shift+M`) - Capture selected text as memory
- `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`) - Search memories
- `Ctrl+Alt+M` (Mac: `Cmd+Alt+M`) - Open quick capture panel

### Commands
Access these commands via the Command Palette (`Ctrl+Shift+P`):

- **DevMemory: Capture Selection as Memory** - Capture selected text
- **DevMemory: Capture Current File as Memory** - Capture entire file
- **DevMemory: Search Memories** - Search your knowledge base
- **DevMemory: Quick Capture** - Open quick capture panel
- **DevMemory: Insert Memory** - Browse and insert a memory
- **DevMemory: Open DevMemory App** - Launch the desktop application

### Context Menus
- **Right-click on selected text** → "Capture Selection as Memory"
- **Right-click on editor tab** → "Capture Current File as Memory"

## Extension Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `devmemory.enabled` | Enable/disable the extension | `true` |
| `devmemory.appPath` | Path to DevMemory executable | `""` |
| `devmemory.autoCapture` | Auto-capture on copy operations | `false` |
| `devmemory.captureCommands` | Auto-capture terminal commands | `true` |
| `devmemory.captureFiles` | Auto-capture file changes | `true` |

## Data Storage

The extension stores memories in a local JSON file that syncs with the main DevMemory application:
- **Windows**: `%APPDATA%/devmemory/vscode-memories.json`
- **macOS**: `~/Library/Application Support/devmemory/vscode-memories.json`
- **Linux**: `~/.config/devmemory/vscode-memories.json`

## Workflow Examples

### 1. **Code Snippet Capture**
```javascript
// Select this function and press Ctrl+Shift+M
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}
```

### 2. **Bug Fix Documentation**
1. Find a bug in your code
2. Select the problematic code
3. Press `Ctrl+Shift+M`
4. Add title: "Bug: Null pointer in user validation"
5. Add tags: "bug, validation, user-management"
6. The fix is now searchable for future reference

### 3. **API Integration Notes**
1. Working with a new API
2. Capture the integration code
3. Add metadata about the API endpoint, authentication
4. Tag with "api, integration, external-service"
5. Easily find this code when working on similar integrations

### 4. **Meeting Decision Capture**
1. During a code review meeting
2. Open quick capture panel (`Ctrl+Alt+M`)
3. Type: "Decision: Use TypeScript for new microservice"
4. Add details about the decision and reasoning
5. Tag: "decision, architecture, typescript"

## Integration with DevMemory App

The VSCode extension works seamlessly with the main DevMemory application:

- **Shared Database**: Memories captured in VSCode appear in the desktop app
- **Vector Search**: Uses the same semantic search capabilities
- **Synchronization**: Changes sync automatically between VSCode and desktop
- **Knowledge Graph**: Your VSCode captures are included in the knowledge graph

## Troubleshooting

### Extension Not Working
1. Check that DevMemory desktop app is installed
2. Verify the app path in extension settings
3. Restart VSCode after configuration changes

### Memories Not Syncing
1. Ensure both VSCode and desktop app have file access permissions
2. Check that the database directory is writable
3. Try manually syncing in the desktop app

### Performance Issues
1. Limit auto-capture features if experiencing slowdowns
2. Clear old memories from the local cache
3. Restart VSCode to reset memory usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with the desktop app
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: Report bugs on the GitHub repository
- **Documentation**: Full documentation in the DevMemory desktop app
- **Community**: Join our developer community for tips and best practices

---

**Happy coding with DevMemory! 🧠💻**