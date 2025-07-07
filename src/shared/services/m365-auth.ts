import { 
  PublicClientApplication,
  Configuration,
  AuthenticationResult,
  AccountInfo,
  SilentFlowRequest,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
  LogLevel,
  Logger
} from '@azure/msal-node';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { createLogger } from '../utils/logger';
import ElectronStore from 'electron-store';

/**
 * M365 Authentication Service for DevMemory
 * Provides enterprise OAuth integration with Azure AD
 * Supports conditional access, MFA, and multi-tenant scenarios
 */

/**
 * Custom Electron Authentication Provider for Microsoft Graph Client
 * Implements the AuthenticationProvider interface required by @microsoft/microsoft-graph-client
 */
class ElectronAuthenticationProvider implements AuthenticationProvider {
  private pca: PublicClientApplication;
  private scopes: string[];
  private logger = createLogger('ElectronAuthProvider');

  constructor(pca: PublicClientApplication, options: {
    scopes: string[];
    interactionType?: 'popup' | 'redirect';
    browserWindow?: any;
  }) {
    this.pca = pca;
    this.scopes = options.scopes;
    this.logger.info('ElectronAuthenticationProvider initialized', {
      scopes: options.scopes.length
    });
  }

  /**
   * Get access token for Microsoft Graph requests
   * This method is called by the Microsoft Graph Client SDK
   */
  async getAccessToken(): Promise<string> {
    try {
      // First try silent token acquisition
      const accounts = await this.pca.getAllAccounts();
      
      if (accounts.length > 0) {
        const silentRequest: SilentFlowRequest = {
          scopes: this.scopes,
          account: accounts[0]
        };

        try {
          const response = await this.pca.acquireTokenSilent(silentRequest);
          this.logger.debug('✓ Silent token acquisition successful');
          return response.accessToken;
        } catch (silentError) {
          this.logger.debug('Silent token acquisition failed, trying interactive', silentError);
        }
      }

      // If silent acquisition fails, we need interactive authentication
      // For now, throw an error indicating user needs to log in through the main flow
      throw new Error('Authentication required: Please use the main login flow');

    } catch (error) {
      this.logger.error('Failed to acquire access token', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export interface M365AuthConfig {
  clientId: string;
  authority?: string; // Optional for multi-tenant support
  redirectUri?: string;
  scopes: string[];
}

export interface M365AuthResult {
  success: boolean;
  account?: AccountInfo;
  accessToken?: string;
  error?: string;
  requiresInteraction?: boolean;
}

export interface M365Status {
  isAuthenticated: boolean;
  account?: AccountInfo;
  tenantId?: string;
  expiresOn?: Date;
  scopes?: string[];
}

export class M365AuthenticationService {
  private pca: PublicClientApplication | null = null;
  private authProvider: AuthenticationProvider | null = null;
  private logger = createLogger('M365Auth');
  private store = new ElectronStore({ name: 'm365-config' });
  private isInitialized = false;

  // Default configuration for enterprise scenarios
  private readonly defaultScopes = [
    'User.Read',
    'Mail.Read',
    'Calendars.Read',
    'Sites.Read.All',
    'Files.Read.All',
    'Chat.Read',
    'OnlineMeetings.Read',
    'People.Read',
    'Directory.Read.Basic'
  ];

  // Enterprise-optimized MSAL configuration
  private readonly msalConfig: Configuration = {
    auth: {
      clientId: '', // Will be set from config
      authority: 'https://login.microsoftonline.com/common', // Multi-tenant by default
    },
    cache: {
      cachePlugin: undefined // Will be configured for persistent cache
    },
    system: {
      loggerOptions: {
        loggerCallback: (level: LogLevel, message: string) => {
          switch (level) {
            case LogLevel.Error:
              this.logger.error('MSAL:', message);
              break;
            case LogLevel.Warning:
              this.logger.warn('MSAL:', message);
              break;
            case LogLevel.Info:
              this.logger.info('MSAL:', message);
              break;
            default:
              this.logger.debug('MSAL:', message);
          }
        },
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false // Security: disable PII logging
      }
    }
  };

  constructor() {
    this.logger.info('M365 Authentication Service initialized');
  }

  /**
   * Initialize MSAL with enterprise configuration
   */
  async initialize(config?: M365AuthConfig): Promise<void> {
    try {
      // Use provided config or default enterprise config
      const authConfig = config || await this.getStoredConfig() || await this.detectEnterpriseConfig();
      
      if (!authConfig.clientId) {
        this.logger.warn('M365 Client ID not configured - M365 integration will be disabled');
        this.logger.info('To enable M365 integration, set AZURE_CLIENT_ID environment variable');
        // Don't throw error - allow app to work without M365 integration
        this.isInitialized = false;
        return;
      }

      // Update MSAL configuration
      this.msalConfig.auth.clientId = authConfig.clientId;
      if (authConfig.authority) {
        this.msalConfig.auth.authority = authConfig.authority;
      }
      // Note: redirectUri is not used for desktop applications with @azure/msal-node
      // Desktop apps use loopback flow automatically

      // Initialize Public Client Application
      this.pca = new PublicClientApplication(this.msalConfig);
      // Note: initialize() is not required for @azure/msal-node

      // Initialize Graph Authentication Provider
      this.authProvider = new ElectronAuthenticationProvider(this.pca, {
        scopes: authConfig.scopes || this.defaultScopes,
        interactionType: 'popup', // Better for desktop apps
        browserWindow: {
          width: 500,
          height: 600,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        }
      });

      this.isInitialized = true;
      this.logger.info('✓ M365 Authentication initialized successfully', {
        clientId: authConfig.clientId.substring(0, 8) + '...',
        authority: this.msalConfig.auth.authority,
        scopes: authConfig.scopes?.length || this.defaultScopes.length
      });

      // Store configuration for future use
      await this.storeConfig(authConfig);

    } catch (error) {
      this.logger.error('Failed to initialize M365 Authentication', error);
      throw error;
    }
  }

  /**
   * Authenticate with M365 using Authorization Code + PKCE flow
   * Supports conditional access and MFA
   */
  async login(scopes?: string[]): Promise<M365AuthResult> {
    if (!this.isInitialized || !this.pca || !this.authProvider) {
      throw new Error('M365 Authentication not initialized. Call initialize() first.');
    }

    try {
      this.logger.info('Starting M365 authentication flow');

      // First try silent authentication (if user already logged in)
      const silentResult = await this.acquireTokenSilently(scopes);
      if (silentResult.success) {
        this.logger.info('✓ Silent authentication successful');
        return silentResult;
      }

      // If silent fails, generate authorization URL for interactive authentication
      this.logger.info('Silent authentication failed, interactive authentication required');

      const authUrlRequest: AuthorizationUrlRequest = {
        scopes: scopes || this.defaultScopes,
        redirectUri: 'http://localhost:3000',
        prompt: 'select_account',
        extraQueryParameters: {
          'domain_hint': (await this.detectUserDomain()) || ''
        }
      };

      const authUrl = await this.pca.getAuthCodeUrl(authUrlRequest);
      
      this.logger.info('Authorization URL generated for interactive authentication');
      
      // Implement interactive authentication flow for Electron
      return new Promise((resolve) => {
        const { shell } = require('electron');
        const http = require('http');
        const url = require('url');
        
        // Create local HTTP server to capture OAuth callback
        const server = http.createServer();
        const port = 3000;
        
        server.on('request', async (req: any, res: any) => {
          const parsedUrl = url.parse(req.url, true);
          
          if (parsedUrl.pathname === '/') {
            try {
              // Extract authorization code from callback
              const authCode = parsedUrl.query.code as string;
              const state = parsedUrl.query.state as string;
              
              if (authCode) {
                this.logger.info('Authorization code received from OAuth callback');
                
                // Exchange authorization code for tokens
                const tokenRequest: AuthorizationCodeRequest = {
                  scopes: scopes || this.defaultScopes,
                  redirectUri: `http://localhost:${port}`,
                  code: authCode,
                };
                
                try {
                  const response = await this.pca?.acquireTokenByCode(tokenRequest);
                  
                  if (!response) {
                    throw new Error('Token acquisition failed - no response');
                  }
                  
                  // Send success response to browser
                  res.writeHead(200, { 'Content-Type': 'text/html' });
                  res.end(`
                    <html>
                      <head><title>DevMemory - Authentication Successful</title></head>
                      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: green;">✓ Authentication Successful</h1>
                        <p>You can now close this browser window and return to DevMemory.</p>
                        <script>
                          setTimeout(() => window.close(), 3000);
                        </script>
                      </body>
                    </html>
                  `);
                  
                  server.close();
                  
                  resolve({
                    success: true,
                    account: response.account || undefined,
                    accessToken: response.accessToken
                  });
                  
                } catch (tokenError: any) {
                  this.logger.error('Token exchange failed', tokenError);
                  
                  // Send error response to browser
                  res.writeHead(400, { 'Content-Type': 'text/html' });
                  res.end(`
                    <html>
                      <head><title>DevMemory - Authentication Error</title></head>
                      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: red;">✗ Authentication Failed</h1>
                        <p>Token exchange failed: ${tokenError.message}</p>
                        <p>Please try again or contact your administrator.</p>
                      </body>
                    </html>
                  `);
                  
                  server.close();
                  
                  resolve({
                    success: false,
                    error: `Token exchange failed: ${tokenError.message}`
                  });
                }
              } else {
                // Handle error callback
                const error = parsedUrl.query.error as string;
                const errorDescription = parsedUrl.query.error_description as string;
                
                this.logger.warn('OAuth callback received error', { error, errorDescription });
                
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end(`
                  <html>
                    <head><title>DevMemory - Authentication Error</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                      <h1 style="color: red;">✗ Authentication Failed</h1>
                      <p>Error: ${error}</p>
                      <p>${errorDescription || 'Please try again or contact your administrator.'}</p>
                    </body>
                  </html>
                `);
                
                server.close();
                
                resolve({
                  success: false,
                  error: errorDescription || error || 'Authentication failed'
                });
              }
            } catch (callbackError: any) {
              this.logger.error('OAuth callback processing failed', callbackError);
              
              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <head><title>DevMemory - Authentication Error</title></head>
                  <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: red;">✗ Authentication Error</h1>
                    <p>Callback processing failed. Please try again.</p>
                  </body>
                </html>
              `);
              
              server.close();
              
              resolve({
                success: false,
                error: `Callback processing failed: ${callbackError.message}`
              });
            }
          }
        });
        
        // Start local server
        server.listen(port, 'localhost', () => {
          this.logger.info(`OAuth callback server started on port ${port}`);
          
          // Open auth URL in system browser
          shell.openExternal(authUrl).then(() => {
            this.logger.info('Authentication URL opened in browser');
          }).catch((error: any) => {
            server.close();
            resolve({
              success: false,
              error: `Failed to open authentication URL: ${error.message}`,
              requiresInteraction: true
            });
          });
        });
        
        // Handle server errors
        server.on('error', (serverError: any) => {
          this.logger.error('OAuth callback server error', serverError);
          server.close();
          resolve({
            success: false,
            error: `Authentication server failed: ${serverError.message}`
          });
        });
        
        // Add timeout to prevent hanging
        setTimeout(() => {
          if (server.listening) {
            this.logger.warn('Authentication timeout - closing server');
            server.close();
            resolve({
              success: false,
              error: 'Authentication timeout. Please try again.'
            });
          }
        }, 300000); // 5 minute timeout
      });

    } catch (error: any) {
      this.logger.error('M365 authentication failed', error);
      
      // Handle specific error scenarios
      if (error.errorCode === 'user_cancelled') {
        return {
          success: false,
          error: 'Authentication was cancelled by user'
        };
      } else if (error.errorCode === 'interaction_required') {
        return {
          success: false,
          error: 'Additional authentication required',
          requiresInteraction: true
        };
      } else {
        return {
          success: false,
          error: error.message || 'Authentication failed'
        };
      }
    }
  }

  /**
   * Attempt silent token acquisition (for background refresh)
   */
  async acquireTokenSilently(scopes?: string[]): Promise<M365AuthResult> {
    if (!this.pca) {
      throw new Error('MSAL not initialized');
    }

    try {
      const accounts = await this.pca.getAllAccounts();
      if (accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts found'
        };
      }

      const request: SilentFlowRequest = {
        scopes: scopes || this.defaultScopes,
        account: accounts[0]
      };

      const response = await this.pca.acquireTokenSilent(request);

      return {
        success: true,
        account: response.account || accounts[0],
        accessToken: response.accessToken
      };

    } catch (error: any) {
      this.logger.debug('Silent token acquisition failed', error.errorCode);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus(): Promise<M365Status> {
    if (!this.pca) {
      return { isAuthenticated: false };
    }

    try {
      const accounts = await this.pca.getAllAccounts();
      
      if (accounts.length === 0) {
        return { isAuthenticated: false };
      }

      const account = accounts[0];
      
      // Try to get a fresh token to verify authentication
      const tokenResult = await this.acquireTokenSilently();
      
      return {
        isAuthenticated: tokenResult.success,
        account: account,
        tenantId: account.tenantId,
        scopes: this.defaultScopes
      };

    } catch (error) {
      this.logger.warn('Failed to get auth status', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Sign out and clear all tokens
   */
  async logout(): Promise<boolean> {
    if (!this.pca) {
      return true; // Already logged out
    }

    try {
      const accounts = await this.pca.getAllAccounts();
      
      // Remove all accounts and tokens
      for (const account of accounts) {
        await this.pca.getTokenCache().removeAccount(account);
      }

      this.logger.info('✓ M365 logout successful');
      return true;

    } catch (error) {
      this.logger.error('M365 logout failed', error);
      return false;
    }
  }

  /**
   * Get the Graph Authentication Provider for Microsoft Graph SDK
   */
  getGraphAuthProvider(): AuthenticationProvider | null {
    return this.authProvider;
  }

  /**
   * Refresh access token automatically
   */
  async refreshToken(): Promise<boolean> {
    try {
      const result = await this.acquireTokenSilently();
      return result.success;
    } catch (error) {
      this.logger.warn('Token refresh failed', error);
      return false;
    }
  }

  // === Private Helper Methods ===

  private async detectEnterpriseConfig(): Promise<M365AuthConfig> {
    // In a real enterprise scenario, this would be configured by IT
    // For now, return a placeholder that needs to be configured
    return {
      clientId: process.env.AZURE_CLIENT_ID || '',
      authority: process.env.AZURE_AUTHORITY || 'https://login.microsoftonline.com/common',
      scopes: this.defaultScopes
    };
  }

  private async detectUserDomain(): Promise<string | undefined> {
    // Could detect user's email domain to optimize authentication flow
    // For enterprise scenarios, this helps pre-fill the correct tenant
    const storedAccount = this.store.get('lastAccount') as AccountInfo;
    if (storedAccount?.username) {
      const domain = storedAccount.username.split('@')[1];
      return domain;
    }
    return undefined;
  }

  private async storeConfig(config: M365AuthConfig): Promise<void> {
    // Store non-sensitive configuration
    this.store.set('m365Config', {
      authority: config.authority,
      scopes: config.scopes
    });
  }

  private async getStoredConfig(): Promise<M365AuthConfig | null> {
    const stored = this.store.get('m365Config') as any;
    if (!stored) return null;

    return {
      clientId: process.env.AZURE_CLIENT_ID || '',
      authority: stored.authority,
      scopes: stored.scopes
    };
  }

  /**
   * Check if service is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.pca !== null && this.authProvider !== null;
  }

  /**
   * Get configuration information for debugging
   */
  getConfig(): any {
    return {
      isInitialized: this.isInitialized,
      authority: this.msalConfig.auth.authority,
      clientIdConfigured: !!this.msalConfig.auth.clientId,
      scopes: this.defaultScopes
    };
  }
}

// Export singleton instance
export const m365AuthService = new M365AuthenticationService();