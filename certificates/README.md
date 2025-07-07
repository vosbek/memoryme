# Code Signing Certificates

This directory should contain your code signing certificates for building signed executables.

## Windows Code Signing

### Required Files
- `code-signing.p12` or `code-signing.pfx` - Your Windows code signing certificate

### Setup Instructions

1. **Obtain a Code Signing Certificate**
   - Purchase from a trusted Certificate Authority (DigiCert, GlobalSign, Sectigo, etc.)
   - Ensure it's an "Code Signing" certificate (not SSL/TLS)
   - Download in .p12 or .pfx format

2. **Install Certificate**
   ```bash
   # Place your certificate file here
   cp /path/to/your/certificate.p12 ./certificates/code-signing.p12
   ```

3. **Set Environment Variables**
   ```bash
   # Windows
   set WINDOWS_CERTIFICATE_FILE=certificates\code-signing.p12
   set WINDOWS_CERTIFICATE_PASSWORD=your-certificate-password
   
   # Linux/macOS
   export WINDOWS_CERTIFICATE_FILE=certificates/code-signing.p12
   export WINDOWS_CERTIFICATE_PASSWORD=your-certificate-password
   ```

4. **Install Windows SDK** (for signtool.exe)
   - Download from: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
   - Or install Visual Studio with Windows development workload

### Development Mode

To skip code signing during development:
```bash
set SKIP_CODE_SIGNING=true
```

### Enterprise Considerations

- **Certificate Management**: Store certificates securely, use HSM for production
- **Password Security**: Use secure environment variables or key vaults
- **Azure Code Signing**: Consider Azure Code Signing for cloud-based signing
- **Timestamping**: Certificates include RFC 3161 timestamping for long-term validity

### Validation

After building, verify signatures:
```bash
# Check signature
signtool verify /pa /v "dist-electron/DevMemory-Setup-1.0.3.exe"

# View certificate details
signtool verify /pa /v /d "dist-electron/DevMemory-Setup-1.0.3.exe"
```

## Security Notes

- **Never commit certificates to version control**
- Certificates are added to `.gitignore`
- Use separate certificates for development and production
- Rotate certificates before expiration
- Monitor certificate transparency logs

## Alternative Signing Methods

### Azure Code Signing
For enterprise environments, consider Azure Code Signing:
- Centralized certificate management
- Hardware Security Module (HSM) backing
- Audit logging and compliance
- No local certificate storage required

### GitHub Actions
For CI/CD pipelines:
- Store certificates as encrypted secrets
- Use secure runners for signing
- Implement approval workflows for production builds