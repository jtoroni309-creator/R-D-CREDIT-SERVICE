import axios from 'axios';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface ShareFileTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface ShareFileUser {
  Id: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Company: string;
  Preferences: any;
}

export class ShareFileService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private subdomain: string;
  private apiUrl: string;

  constructor() {
    this.clientId = process.env.SHAREFILE_CLIENT_ID || '';
    this.clientSecret = process.env.SHAREFILE_CLIENT_SECRET || '';
    this.redirectUri = process.env.SHAREFILE_REDIRECT_URI || '';
    this.subdomain = process.env.SHAREFILE_SUBDOMAIN || '';
    this.apiUrl = process.env.SHAREFILE_API_URL || '';

    if (!this.clientId || !this.clientSecret) {
      logger.warn('ShareFile credentials not configured');
    }
  }

  /**
   * Generate ShareFile OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state: this.generateState(),
    });

    return `https://${this.subdomain}.sharefile.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<ShareFileTokens> {
    try {
      const response = await axios.post(
        `https://${this.subdomain}.sharefile.com/oauth/token`,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Failed to exchange code for tokens:', error.response?.data);
      throw new AppError('Failed to authenticate with ShareFile', 500);
    }
  }

  /**
   * Get user information from ShareFile
   */
  async getUserInfo(accessToken: string): Promise<ShareFileUser> {
    try {
      const response = await axios.get(`${this.apiUrl}/Users/Principal`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get user info:', error.response?.data);
      throw new AppError('Failed to get user information from ShareFile', 500);
    }
  }

  /**
   * Create a folder in ShareFile
   */
  async createFolder(accessToken: string, parentId: string, name: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/Items(${parentId})/Folder`,
        {
          Name: name,
          Description: 'R&D Tax Credit Engagement Folder',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Failed to create folder:', error.response?.data);
      throw new AppError('Failed to create folder in ShareFile', 500);
    }
  }

  /**
   * Upload a file to ShareFile
   */
  async uploadFile(
    accessToken: string,
    folderId: string,
    fileName: string,
    fileBuffer: Buffer
  ): Promise<any> {
    try {
      // Step 1: Request upload specification
      const uploadSpecResponse = await axios.post(
        `${this.apiUrl}/Items(${folderId})/Upload`,
        {
          Method: 'Standard',
          Raw: true,
          FileName: fileName,
          FileSize: fileBuffer.length,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const uploadSpec = uploadSpecResponse.data;

      // Step 2: Upload the file
      const uploadResponse = await axios.post(uploadSpec.ChunkUri, fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      return uploadResponse.data;
    } catch (error: any) {
      logger.error('Failed to upload file:', error.response?.data);
      throw new AppError('Failed to upload file to ShareFile', 500);
    }
  }

  /**
   * Get folder contents
   */
  async getFolderContents(accessToken: string, folderId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/Items(${folderId})/Children`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get folder contents:', error.response?.data);
      throw new AppError('Failed to get folder contents from ShareFile', 500);
    }
  }

  /**
   * Generate random state for OAuth
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}
