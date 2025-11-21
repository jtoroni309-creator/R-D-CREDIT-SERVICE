import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ShareFileService } from '../services/sharefile.service';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  private authService: AuthService;
  private shareFileService: ShareFileService;

  constructor() {
    this.authService = new AuthService();
    this.shareFileService = new ShareFileService();
  }

  initiateShareFileLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUrl = this.shareFileService.getAuthorizationUrl();
      res.json({ authUrl });
    } catch (error) {
      next(error);
    }
  };

  handleShareFileCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      // Exchange code for tokens
      const tokens = await this.shareFileService.exchangeCodeForTokens(code);

      // Get user info from ShareFile
      const shareFileUser = await this.shareFileService.getUserInfo(tokens.access_token);

      // Create or update user in our database
      const user = await this.authService.findOrCreateUser({
        shareFileUserId: shareFileUser.Id,
        email: shareFileUser.Email,
        firstName: shareFileUser.FirstName,
        lastName: shareFileUser.LastName,
      });

      // Generate our JWT tokens
      const jwtTokens = this.authService.generateTokens(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens: jwtTokens,
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const tokens = await this.authService.refreshAccessToken(refreshToken);
      res.json(tokens);
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await this.authService.getUserById(req.user.id);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // In a production app, you might want to blacklist the token
      // For now, client-side token deletion is sufficient
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };
}
