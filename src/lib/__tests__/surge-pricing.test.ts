import { calculateFare, calculateSurgeMultiplier, getDemandLevel } from '../surge-pricing';

describe('Surge Pricing System', () => {
  describe('calculateFare', () => {
    it('should calculate base fare for standard ride (5km, 10min)', async () => {
      const fare = await calculateFare('STANDARD_RIDE', 5000, 600, 40.7128, -74.0060);
      
      expect(fare).toBeDefined();
      expect(fare.baseFare).toBeCloseTo(5.00, 0.01);
      expect(fare.surgeMultiplier).toBe(1.0);
      expect(fare.estimatedFare).toBeCloseTo(5.00, 0.01);
    });

    it('should apply surge multiplier (1.5x)', async () => {
      // Mock surge zone data
      const fare = await calculateFare('STANDARD_RIDE', 5000, 600, 40.7128, -74.0060, 5000, -74.0060, 1.5);
      
      expect(fare).toBeDefined();
      expect(fare.surgeMultiplier).toBe(1.5);
      expect(fare.estimatedFare).toBeCloseTo(7.50, 0.01);
    });

    it('should calculate premium ride fare (higher rate)', async () => {
      const fare = await calculateFare('PREMIUM_RIDE', 5000, 600, 40.7128, -74.0060);
      
      expect(fare).toBeDefined();
      expect(fare.baseFare).toBeCloseTo(7.00, 0.01); // Premium rate
    });

    it('should calculate bike fare (lower rate)', async () => {
      const fare = await calculateFare('BIKE', 3000, 600, 40.7128, -74.0060);
      
      expect(fare).toBeDefined();
      expect(fare.baseFare).toBeCloseTo(3.00, 0.01); // Bike rate
    });

    it('should return error for invalid service type', async () => {
      expect(() => {
        calculateFare('INVALID_SERVICE' as any, 5000, 600, 40.7128, -74.0060);
      }).toThrow('Invalid service type');
    });
  });

  describe('calculateSurgeMultiplier', () => {
    it('should calculate 1.0x surge (low demand)', () => {
      const surge = calculateSurgeMultiplier(20, 20, 10); // 20% demand, 20 drivers, 10 requests
      
      expect(surge).toBe(1.0);
    });

    it('should calculate 1.5x surge (medium demand, few drivers)', () => {
      const surge = calculateSurgeMultiplier(50, 10, 20); // 50% demand, 10 drivers, 20 requests
      
      expect(surge).toBeGreaterThan(1.0);
      expect(surge).toBeLessThan(2.0);
    });

    it('should calculate 2.0x surge (high demand)', () => {
      const surge = calculateSurgeMultiplier(80, 10, 30); // 80% demand, 10 drivers, 30 requests
      
      expect(surge).toBeGreaterThanOrEqual(2.0);
    });

    it('should calculate 3.0x surge (critical demand)', () => {
      const surge = calculateSurgeMultiplier(100, 5, 50); // 100% demand, 5 drivers, 50 requests
      
      expect(surge).toBe(3.0);
    });

    it('should cap at 4.0x (extreme demand)', () => {
      const surge = calculateSurgeMultiplier(150, 2, 100); // 150% demand, 2 drivers, 100 requests
      
      expect(surge).toBe(4.0); // Capped at 4.0x
    });

    it('should return 1.0x (excess drivers)', () => {
      const surge = calculateSurgeMultiplier(30, 50, 10); // 30% demand, 50 drivers, 10 requests
      
      expect(surge).toBeLessThan(1.0);
    });
  });

  describe('getDemandLevel', () => {
    it('should return LOW for < 40% demand', () => {
      const level = getDemandLevel(20);
      
      expect(level).toBe('LOW');
    });

    it('should return MEDIUM for 40-60% demand', () => {
      const level = getDemandLevel(50);
      
      expect(level).toBe('MEDIUM');
    });

    it('should return HIGH for 60-80% demand', () => {
      const level = getDemandLevel(70);
      
      expect(level).toBe('HIGH');
    });

    it('should return CRITICAL for > 80% demand', () => {
      const level = getDemandLevel(90);
      
      expect(level).toBe('CRITICAL');
    });
  });

  describe('Integration Tests', () => {
    it('should calculate total fare with surge', async () => {
      const surge = calculateSurgeMultiplier(80, 10, 30); // High surge: 2.0x
      const fare = await calculateFare('STANDARD_RIDE', 5000, 600, 40.7128, -74.0060, 40.7128, -74.0060, surge);
      
      expect(fare.baseFare).toBeCloseTo(5.00, 0.01);
      expect(fare.surgeMultiplier).toBe(surge);
      expect(fare.estimatedFare).toBeCloseTo(5.00 * surge, 0.1);
      expect(fare.demandLevel).toBe('HIGH');
    });

    it('should calculate premium ride with high surge', async () => {
      const surge = calculateSurgeMultiplier(90, 5, 40); // Critical surge: 3.0x
      const fare = await calculateFare('PREMIUM_RIDE', 5000, 600, 40.7128, -74.0060, 40.7128, -74.0060, surge);
      
      expect(fare.demandLevel).toBe('CRITICAL');
      expect(fare.surgeMultiplier).toBe(3.0);
      expect(fare.estimatedFare).toBeCloseTo(7.00 * 3.0, 0.1);
    });

    it('should calculate bike fare with low surge', async () => {
      const surge = calculateSurgeMultiplier(30, 40, 10); // Low surge: 1.2x
      const fare = await calculateFare('BIKE', 3000, 600, 40.7128, -74.0060, 40.7128, -74.0060, surge);
      
      expect(fare.demandLevel).toBe('MEDIUM');
      expect(fare.surgeMultiplier).toBeCloseTo(1.2, 0.1);
    });
  });
});
