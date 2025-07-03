# DevMemory Assets

This directory contains application assets including icons and resources.

## Icons Required

To build the installer packages, you need to provide the following icon files:

### Windows
- `icon.ico` - Windows icon file (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)

### macOS  
- `icon.icns` - macOS icon file (1024x1024, 512x512, 256x256, 128x128, 64x64, 32x32, 16x16)

### Linux
- `icon.png` - PNG icon file (512x512 recommended)

## Creating Icons

You can create these icons from a single high-resolution PNG (1024x1024) using:

### For Windows (.ico):
- Use online converters like favicon.io or PNG to ICO converters
- Or use ImageMagick: `convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`

### For macOS (.icns):
- Use `iconutil` on macOS: Create an iconset folder with multiple PNG sizes
- Or use online converters

### For Linux (.png):
- Simply use a high-resolution PNG file (512x512 or 1024x1024)

## Placeholder Icons

For development/testing, you can create simple placeholder icons or use the default Electron icons by removing the icon references from package.json.

## Icon Design Guidelines

- Use a simple, recognizable design that works at small sizes
- Consider the DevMemory brain/memory theme
- Ensure good contrast for both light and dark backgrounds
- Test at multiple sizes (16px to 1024px)

## Building Without Icons

If you don't have custom icons yet, remove these lines from package.json:
```json
"icon": "assets/icon.ico",     // Windows
"icon": "assets/icon.icns",    // macOS  
"icon": "assets/icon.png"      // Linux
```

The build process will use default Electron icons instead.