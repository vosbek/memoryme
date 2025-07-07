#!/usr/bin/env node

/**
 * Windows Code Signing Script for DevMemory
 * 
 * This script handles code signing for Windows executables using:
 * - Certificate files (.p12/.pfx)
 * - Windows SDK signtool.exe
 * - Azure Code Signing (future)
 * 
 * Environment Variables:
 * - WINDOWS_CERTIFICATE_FILE: Path to .p12/.pfx certificate
 * - WINDOWS_CERTIFICATE_PASSWORD: Certificate password
 * - WINDOWS_SIGN_TOOL_PATH: Path to signtool.exe (optional)
 * - SKIP_CODE_SIGNING: Set to 'true' to skip signing in development
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration from environment or defaults
const config = {
  certificateFile: process.env.WINDOWS_CERTIFICATE_FILE || './certificates/code-signing.p12',
  certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD || '',
  signToolPath: process.env.WINDOWS_SIGN_TOOL_PATH || 'signtool.exe',
  skipSigning: process.env.SKIP_CODE_SIGNING === 'true',
  timestampUrl: 'http://timestamp.sectigo.com',
  publisherName: 'Enterprise Development Team'
};

/**
 * Main signing function called by electron-builder
 * @param {object} options - Signing options from electron-builder
 */
async function sign(options) {
  const { path: filePath, name, site: _site, options: _builderOptions } = options;
  
  console.log(`🔐 Code signing: ${name || path.basename(filePath)}`);
  
  // Skip signing in development or if explicitly disabled
  if (config.skipSigning) {
    console.log('⚠️  Code signing skipped (SKIP_CODE_SIGNING=true)');
    return;
  }
  
  // Check if certificate exists
  if (!fs.existsSync(config.certificateFile)) {
    console.log('⚠️  Code signing certificate not found, skipping signing');
    console.log(`   Expected: ${config.certificateFile}`);
    console.log('   To enable code signing:');
    console.log('   1. Obtain a code signing certificate from a trusted CA');
    console.log('   2. Place it at: certificates/code-signing.p12');
    console.log('   3. Set WINDOWS_CERTIFICATE_PASSWORD environment variable');
    return;
  }
  
  try {
    // Build signtool command
    const signCommand = [
      `"${config.signToolPath}"`,
      'sign',
      '/f', `"${config.certificateFile}"`,
      '/p', `"${config.certificatePassword}"`,
      '/t', config.timestampUrl,
      '/fd', 'SHA256',
      '/v', // Verbose output
      `"${filePath}"`
    ].join(' ');
    
    console.log('   Running signtool...');
    
    // Execute signing
    execSync(signCommand, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Code signing completed successfully');
    
    // Verify signature
    const verifyCommand = [
      `"${config.signToolPath}"`,
      'verify',
      '/pa', // Use default authentication verification policy
      '/v',  // Verbose
      `"${filePath}"`
    ].join(' ');
    
    console.log('   Verifying signature...');
    execSync(verifyCommand, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Signature verification completed');
    
  } catch (error) {
    console.error('❌ Code signing failed:', error.message);
    
    // In development, don't fail the build
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Continuing build without code signing (development mode)');
      return;
    }
    
    // In production, fail the build
    throw new Error(`Code signing failed: ${error.message}`);
  }
}

/**
 * Check if signtool is available
 */
function checkSignTool() {
  try {
    execSync(`"${config.signToolPath}" /? >nul 2>&1`, { stdio: 'ignore' });
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Setup instructions for code signing
 */
function printSetupInstructions() {
  console.log('\n📋 Code Signing Setup Instructions:');
  console.log('');
  console.log('1. Install Windows SDK (for signtool.exe):');
  console.log('   https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/');
  console.log('');
  console.log('2. Obtain a code signing certificate:');
  console.log('   - DigiCert, GlobalSign, Sectigo, or other trusted CA');
  console.log('   - Export as .p12/.pfx file');
  console.log('');
  console.log('3. Configure environment:');
  console.log('   set WINDOWS_CERTIFICATE_FILE=certificates\\code-signing.p12');
  console.log('   set WINDOWS_CERTIFICATE_PASSWORD=your-certificate-password');
  console.log('');
  console.log('4. For development, skip signing:');
  console.log('   set SKIP_CODE_SIGNING=true');
  console.log('');
}

// If run directly, show setup instructions
if (require.main === module) {
  console.log('🔐 DevMemory Windows Code Signing');
  
  if (!checkSignTool()) {
    console.log('❌ signtool.exe not found');
    printSetupInstructions();
    process.exit(1);
  }
  
  console.log('✅ signtool.exe is available');
  
  if (!fs.existsSync(config.certificateFile)) {
    console.log('⚠️  Code signing certificate not found');
    printSetupInstructions();
  } else {
    console.log('✅ Code signing certificate found');
  }
}

module.exports = sign;