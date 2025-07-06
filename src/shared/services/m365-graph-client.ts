import { Client } from '@microsoft/microsoft-graph-client';
import { m365AuthService } from './m365-auth';
import { createLogger } from '../utils/logger';

/**
 * Microsoft Graph Client for DevMemory
 * Provides unified access to M365 services with enterprise authentication
 */

export interface GraphUserProfile {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones?: string[];
}

export interface GraphOrganization {
  id: string;
  displayName: string;
  verifiedDomains: Array<{
    name: string;
    isDefault: boolean;
  }>;
}

export interface ConnectionTestResult {
  success: boolean;
  userProfile?: GraphUserProfile;
  organization?: GraphOrganization;
  services: {
    mail: boolean;
    calendar: boolean;
    files: boolean;
    teams: boolean;
    sharepoint: boolean;
  };
  error?: string;
}

export class M365GraphClient {
  private client: Client | null = null;
  private logger = createLogger('M365GraphClient');
  private isInitialized = false;

  constructor() {
    this.logger.info('Microsoft Graph client initialized');
  }

  /**
   * Initialize the Graph client with authentication
   */
  async initialize(): Promise<void> {
    try {
      if (!m365AuthService.isReady()) {
        await m365AuthService.initialize();
      }

      const authProvider = m365AuthService.getGraphAuthProvider();
      if (!authProvider) {
        throw new Error('M365 authentication not available');
      }

      // Initialize Microsoft Graph client
      this.client = Client.initWithMiddleware({
        authProvider: authProvider
      });

      this.isInitialized = true;
      this.logger.info('✓ Microsoft Graph client initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Microsoft Graph client', error);
      throw error;
    }
  }

  /**
   * Test M365 connectivity and get basic profile information
   */
  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.client) {
      await this.initialize();
    }

    if (!this.client) {
      return {
        success: false,
        error: 'Graph client not initialized',
        services: {
          mail: false,
          calendar: false,
          files: false,
          teams: false,
          sharepoint: false
        }
      };
    }

    try {
      this.logger.info('Testing M365 connectivity');

      // Test basic profile access
      const userProfile = await this.getUserProfile();
      const organization = await this.getOrganization();

      // Test service access
      const services = await this.testServiceAccess();

      this.logger.info('✓ M365 connectivity test successful', {
        user: userProfile.displayName,
        organization: organization?.displayName,
        services
      });

      return {
        success: true,
        userProfile,
        organization: organization || undefined,
        services
      };

    } catch (error: any) {
      this.logger.error('M365 connectivity test failed', error);
      
      return {
        success: false,
        error: error.message || 'Connection test failed',
        services: {
          mail: false,
          calendar: false,
          files: false,
          teams: false,
          sharepoint: false
        }
      };
    }
  }

  /**
   * Get current user's profile information
   */
  async getUserProfile(): Promise<GraphUserProfile> {
    if (!this.client) {
      throw new Error('Graph client not initialized');
    }

    try {
      const user = await this.client.api('/me').get();
      
      return {
        id: user.id,
        displayName: user.displayName,
        mail: user.mail || user.userPrincipalName,
        userPrincipalName: user.userPrincipalName,
        jobTitle: user.jobTitle,
        department: user.department,
        officeLocation: user.officeLocation,
        mobilePhone: user.mobilePhone,
        businessPhones: user.businessPhones
      };

    } catch (error) {
      this.logger.error('Failed to get user profile', error);
      throw error;
    }
  }

  /**
   * Get organization information
   */
  async getOrganization(): Promise<GraphOrganization | null> {
    if (!this.client) {
      throw new Error('Graph client not initialized');
    }

    try {
      const organizations = await this.client.api('/organization').get();
      
      if (organizations.value && organizations.value.length > 0) {
        const org = organizations.value[0];
        return {
          id: org.id,
          displayName: org.displayName,
          verifiedDomains: org.verifiedDomains || []
        };
      }

      return null;

    } catch (error) {
      this.logger.warn('Failed to get organization info', error);
      return null;
    }
  }

  /**
   * Test access to various M365 services
   */
  private async testServiceAccess(): Promise<{
    mail: boolean;
    calendar: boolean;
    files: boolean;
    teams: boolean;
    sharepoint: boolean;
  }> {
    const services = {
      mail: false,
      calendar: false,
      files: false,
      teams: false,
      sharepoint: false
    };

    if (!this.client) {
      return services;
    }

    // Test Mail access
    try {
      await this.client.api('/me/messages').top(1).get();
      services.mail = true;
      this.logger.debug('✓ Mail access confirmed');
    } catch (error) {
      this.logger.debug('✗ Mail access failed', error);
    }

    // Test Calendar access
    try {
      await this.client.api('/me/events').top(1).get();
      services.calendar = true;
      this.logger.debug('✓ Calendar access confirmed');
    } catch (error) {
      this.logger.debug('✗ Calendar access failed', error);
    }

    // Test Files access (OneDrive)
    try {
      await this.client.api('/me/drive/root/children').top(1).get();
      services.files = true;
      this.logger.debug('✓ Files access confirmed');
    } catch (error) {
      this.logger.debug('✗ Files access failed', error);
    }

    // Test Teams access
    try {
      await this.client.api('/me/joinedTeams').top(1).get();
      services.teams = true;
      this.logger.debug('✓ Teams access confirmed');
    } catch (error) {
      this.logger.debug('✗ Teams access failed', error);
    }

    // Test SharePoint access
    try {
      await this.client.api('/sites?search=*').top(1).get();
      services.sharepoint = true;
      this.logger.debug('✓ SharePoint access confirmed');
    } catch (error) {
      this.logger.debug('✗ SharePoint access failed', error);
    }

    return services;
  }

  /**
   * Get recent emails for knowledge extraction
   */
  async getRecentEmails(limit: number = 10): Promise<any[]> {
    if (!this.client) {
      throw new Error('Graph client not initialized');
    }

    try {
      const messages = await this.client
        .api('/me/messages')
        .select('id,subject,body,from,toRecipients,receivedDateTime,importance,conversationId')
        .orderby('receivedDateTime desc')
        .top(limit)
        .get();

      return messages.value || [];

    } catch (error) {
      this.logger.error('Failed to get recent emails', error);
      throw error;
    }
  }

  /**
   * Get recent calendar events
   */
  async getRecentEvents(limit: number = 10): Promise<any[]> {
    if (!this.client) {
      throw new Error('Graph client not initialized');
    }

    try {
      const events = await this.client
        .api('/me/events')
        .select('id,subject,body,start,end,attendees,organizer,location,onlineMeeting')
        .orderby('start/dateTime desc')
        .top(limit)
        .get();

      return events.value || [];

    } catch (error) {
      this.logger.error('Failed to get recent events', error);
      throw error;
    }
  }

  /**
   * Get user's recent OneDrive files
   */
  async getRecentFiles(limit: number = 10): Promise<any[]> {
    if (!this.client) {
      throw new Error('Graph client not initialized');
    }

    try {
      const files = await this.client
        .api('/me/drive/recent')
        .select('id,name,size,lastModifiedDateTime,lastModifiedBy,createdBy,webUrl,mimeType,parentReference,@microsoft.graph.downloadUrl')
        .top(limit)
        .get();

      return files.value || [];

    } catch (error) {
      this.logger.error('Failed to get recent files', error);
      throw error;
    }
  }

  /**
   * Get user's teams and channels
   */
  async getTeams(): Promise<any[]> {
    if (!this.client) {
      throw new Error('Graph client not initialized');
    }

    try {
      const teams = await this.client
        .api('/me/joinedTeams')
        .select('id,displayName,description,webUrl')
        .get();

      return teams.value || [];

    } catch (error) {
      this.logger.error('Failed to get teams', error);
      throw error;
    }
  }

  /**
   * Get recent SharePoint sites
   */
  async getSharePointSites(limit: number = 10): Promise<any[]> {
    if (!this.client) {
      throw new Error('Graph client not initialized');
    }

    try {
      const sites = await this.client
        .api('/sites?search=*')
        .select('id,displayName,webUrl,description,lastModifiedDateTime')
        .top(limit)
        .get();

      return sites.value || [];

    } catch (error) {
      this.logger.error('Failed to get SharePoint sites', error);
      throw error;
    }
  }

  /**
   * Search across M365 content
   */
  async searchContent(query: string, entityTypes: string[] = ['message', 'event', 'site', 'driveItem']): Promise<any[]> {
    if (!this.client) {
      throw new Error('Graph client not initialized');
    }

    try {
      const searchRequest = {
        requests: [{
          entityTypes: entityTypes,
          query: {
            queryString: query
          },
          from: 0,
          size: 25
        }]
      };

      const results = await this.client
        .api('/search/query')
        .post(searchRequest);

      if (results.value && results.value[0] && results.value[0].hitsContainers) {
        return results.value[0].hitsContainers[0].hits || [];
      }

      return [];

    } catch (error) {
      this.logger.error('Failed to search M365 content', error);
      throw error;
    }
  }

  /**
   * Check if client is ready for use
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Get the raw Graph client for advanced operations
   */
  getClient(): Client | null {
    return this.client;
  }
}

// Export singleton instance
export const m365GraphClient = new M365GraphClient();