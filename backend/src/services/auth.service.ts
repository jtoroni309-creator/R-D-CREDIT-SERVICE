import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { User, UserRole } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

interface UserCreateData {
  shareFileUserId: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  shareFileUserId: string;
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private jwtRefreshExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || '';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET must be defined');
    }
  }

  /**
   * Find existing user or create new one
   */
  async findOrCreateUser(data: UserCreateData): Promise<User> {
    let user = await prisma.user.findUnique({
      where: { shareFileUserId: data.shareFileUserId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          shareFileUserId: data.shareFileUserId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: UserRole.STAFF, // Default role
          isActive: true,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    return user;
  }

  /**
   * Generate JWT access and refresh tokens
   */
  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      shareFileUserId: user.shareFileUserId,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });

    const refreshToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as TokenPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 401);
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return user;
  }
}
