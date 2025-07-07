@echo off
echo Copying SQL.js WASM files to dist directory...

rem Create the dist directory structure
if not exist "dist\sql.js\dist" mkdir "dist\sql.js\dist"

rem Copy all WASM files
xcopy "node_modules\sql.js\dist\*.wasm" "dist\sql.js\dist\" /Y

echo WASM files copied successfully!
echo Files copied to: dist\sql.js\dist\

pause