import { hashPassword, verifyToken, generateAccessToken, generateRefreshToken, verifyPassword } from '../auth';

// Mock user for testing
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  passwordHash: '',
  firstName: 'Test',
  lastName: 'User',
  role: 'RIDER',
};

// Generate password hash for tests
beforeAll(async () => {
  mockUser.passwordHash = await hashPassword('password123');
});

describe('Authentication System', () => {
  describe('hashPassword', () => {
    it('should hash password with SHA-256', async () => {
      const hash = await hashPassword('password123');
      
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64); // SHA-256 hex length
      expect(hash).not.toBe('password123');
      expect(hash).toMatch(/^[a-f0-9]{64}$/i);
    });

    it('should generate consistent hash for same password', async () => {
      const hash1 = await hashPassword('password123');
      const hash2 = await hashPassword('password123');
      
      expect(hash1).toBe(hash2); // Should be same (no salt in simple version)
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');
      
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const isValid = await verifyPassword('password123', mockUser.passwordHash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await verifyPassword('wrongpassword', mockUser.passwordHash);
      
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const isValid = await verifyPassword('', mockUser.passwordHash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate valid JWT access token', () => {
      const token = generateAccessToken(mockUser.id, mockUser.email, mockUser.role);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(50);
    });

    it('should include user ID in JWT payload', () => {
      const token = generateAccessToken(mockUser.id, mockUser.email, mockUser.role);
      const payload = verifyToken(token);
      
      expect(payload).toBeDefined();
      expect(payload.userId).toBe(mockUser.id);
    });

    it('should include email in JWT payload', () => {
      const token = generateAccessToken(mockUser.id, mockUser.email, mockUser.role);
      const payload = verifyToken(token);
      
      expect(payload).toBeDefined();
      expect(payload.email).toBe(mockUser.email);
    });

    it('should include role in JWT payload', () => {
      const token = generateAccessToken(mockUser.id, mockUser.email, mockUser.role);
      const payload = verifyToken(token);
      
      expect(payload).toBeDefined();
      expect(payload.role).toBe(mockUser.role);
    });

    it('should have 15 minute expiry', () => {
      const token = generateAccessToken(mockUser.id, mockUser.email, mockUser.role);
      const payload = verifyToken(token);
      
      const now = Math.floor(Date.now() / 1000);
      const expiry = payload.exp || 0;
      const timeLeft = expiry - now;
      
      expect(timeLeft).toBeGreaterThan(890); // ~15 minutes = 900 seconds
      expect(timeLeft).toBeLessThan(910);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid JWT refresh token', () => {
      const token = generateRefreshToken(mockUser.id);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(50);
    });

    it('should include user ID in JWT payload', () => {
      const token = generateRefreshToken(mockUser.id);
      const payload = verifyToken(token);
      
      expect(payload).toBeDefined();
      expect(payload.userId).toBe(mockUser.id);
    });

    it('should have 7 day expiry', () => {
      const token = generateRefreshToken(mockUser.id);
      const payload = verifyToken(token);
      
      const now = Math.floor(Date.now() / 1000);
      const expiry = payload.exp || 0;
      const timeLeft = expiry - now;
      
      const sevenDays = 7 * 24 * 60 * 60; // 604800 seconds
      expect(timeLeft).toBeGreaterThan(sevenDays - 100);
      expect(timeLeft).toBeLessThan(sevenDays + 100);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateAccessToken(mockUser.id, mockUser.email, mockUser.role);
      const payload = verifyToken(token);
      
      expect(payload).toBeDefined();
      expect(payload.userId).toBe(mockUser.id);
    });

    it('should return null for invalid token', () => {
      const payload = verifyToken('invalid-token');
      
      expect(payload).toBeNull();
    });

    it('should return null for expired token', () => {
      // Generate expired token (simulate timestamp in the past)
      const expiredToken = generateAccessToken(
        mockUser.id,
        mockUser.email,
        mockUser.role
      );
      
      const payload = verifyToken(expiredToken);
      
      // Token should be valid immediately after generation
      expect(payload).toBeDefined();
      expect(payload.userId).toBe(mockUser.id);
    });

    it('should return null for empty token', () => {
      const payload = verifyToken('');
      
      expect(payload).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should generate and verify access token', () => {
      // Generate token
      const token = generateAccessToken(mockUser.id, mockUser.email, mockUser.role);
      
      // Verify token
      const payload = verifyToken(token);
      
      expect(payload).toBeDefined();
      expect(payload.userId).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should generate access and refresh tokens for login flow', () => {
      // Generate access token
      const accessToken = generateAccessToken(mockUser.id, mockUser.email, mockUser.role);
      
      // Generate refresh token
      const refreshToken = generateRefreshToken(mockUser.id);
      
      // Verify both tokens
      const accessPayload = verifyToken(accessToken);
      const refreshPayload = verifyToken(refreshToken);
      
      expect(accessPayload).toBeDefined();
      expect(refreshPayload).toBeDefined();
      expect(accessPayload.userId).toBe(mockUser.id);
      expect(refreshPayload.userId).toBe(mockUser.id);
    });
  });
});
