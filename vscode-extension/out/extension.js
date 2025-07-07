"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const devMemoryClient_1 = require("./devMemoryClient");
const quickCapturePanel_1 = require("./quickCapturePanel");
let devMemoryClient;
function activate(context) {
    console.log('DevMemory extension is now active!');
    // Initialize the DevMemory client
    devMemoryClient = new devMemoryClient_1.DevMemoryClient();
    // Register minimal commands for keyboard shortcuts
    registerCommands(context);
    // Show welcome message
    vscode.window.showInformationMessage('DevMemory extension activated! Use Ctrl+Alt+M to open the memory panel.');
}
function registerCommands(context) {
    // Simplified command registration - main functionality moved to panel
    // Quick capture via keyboard shortcut
    const quickCapture = vscode.commands.registerCommand('devmemory.quickCapture', async () => {
        quickCapturePanel_1.QuickCapturePanel.createOrShow(context.extensionUri, devMemoryClient);
    });
    // Register commands
    context.subscriptions.push(quickCapture);
}
function deactivate() {
    console.log('DevMemory extension deactivated');
}
//# sourceMappingURL=extension.js.map