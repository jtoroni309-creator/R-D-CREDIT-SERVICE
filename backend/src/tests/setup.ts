// Test setup file
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client for testing
jest.mock('../index', () => ({
  prisma: new PrismaClient(),
}));

// Setup environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Close database connections
  const { prisma } = require('../index');
  await prisma.$disconnect();
});
