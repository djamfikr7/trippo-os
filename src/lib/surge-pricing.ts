import { db } from '@/lib/db';

export interface SurgeCalculationResult {
  baseFare: number;
  surgeMultiplier: number;
  surgeFare: number;
  estimatedFare: number;
  surgeZone?: string;
  demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface FareConfig {
  baseFare: number;
  ratePerKm: number;
  ratePerMinute: number;
  minimumFare: number;
}

// Service type pricing configuration
const fareConfigs: Record<string, FareConfig> = {
  STANDARD_RIDE: { baseFare: 2.00, ratePerKm: 1.50, ratePerMinute: 0.25, minimumFare: 5.00 },
  PREMIUM_RIDE: { baseFare: 3.50, ratePerKm: 2.50, ratePerMinute: 0.40, minimumFare: 8.00 },
  BIKE: { baseFare: 1.00, ratePerKm: 0.80, ratePerMinute: 0.15, minimumFare: 3.00 },
  CARGO: { baseFare: 4.00, ratePerKm: 2.00, ratePerMinute: 0.35, minimumFare: 10.00 },
  TRUCK: { baseFare: 6.00, ratePerKm: 3.50, ratePerMinute: 0.50, minimumFare: 15.00 },
  TOWING: { baseFare: 10.00, ratePerKm: 4.00, ratePerMinute: 0.60, minimumFare: 20.00 },
  ON_SITE_REPAIR: { baseFare: 15.00, ratePerKm: 0, ratePerMinute: 1.00, minimumFare: 25.00 },
  INTERCITY: { baseFare: 20.00, ratePerKm: 1.20, ratePerMinute: 0.30, minimumFare: 50.00 },
  RIDE_SHARE: { baseFare: 1.50, ratePerKm: 1.00, ratePerMinute: 0.20, minimumFare: 4.00 },
};

// Surge thresholds
const SURGE_THRESHOLDS = {
  LOW: 40,      // < 40% demand
  MEDIUM: 60,   // 40-60% demand
  HIGH: 80,     // 60-80% demand
  CRITICAL: 80,  // > 80% demand
};

// Surge multipliers based on demand and driver availability
const calculateSurgeMultiplier = (
  demand: number,
  availableDrivers: number,
  pendingRequests: number
): number => {
  // Base surge on demand level
  let baseMultiplier = 1.0;

  if (demand >= SURGE_THRESHOLDS.CRITICAL) {
    baseMultiplier = 2.5;
  } else if (demand >= SURGE_THRESHOLDS.HIGH) {
    baseMultiplier = 2.0;
  } else if (demand >= SURGE_THRESHOLDS.MEDIUM) {
    baseMultiplier = 1.5;
  } else if (demand >= SURGE_THRESHOLDS.LOW) {
    baseMultiplier = 1.2;
  }

  // Adjust multiplier based on driver availability
  const driverRatio = availableDrivers / Math.max(pendingRequests, 1);
  if (driverRatio < 0.5) {
    // Very few drivers - increase surge
    baseMultiplier *= 1.5;
  } else if (driverRatio < 1.0) {
    // Drivers available but not enough
    baseMultiplier *= 1.2;
  } else if (driverRatio > 2.0) {
    // Excess drivers - reduce surge
    baseMultiplier *= 0.9;
  }

  // Cap surge at 4.0x
  return Math.min(Math.max(baseMultiplier, 1.0), 4.0);
};

// Calculate demand level
const getDemandLevel = (demand: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  if (demand >= SURGE_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (demand >= SURGE_THRESHOLDS.HIGH) return 'HIGH';
  if (demand >= SURGE_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
};

// Get surge zone for a location
const getSurgeZone = async (
  pickupLat: number,
  pickupLng: number
): Promise<{ zoneName?: string; demand: number; surgeMultiplier: number; activeDrivers: number }> => {
  try {
    // Simplified geospatial query for SQLite
    // In production with PostGIS, use ST_DWithin
    const surgeZones = await db.surgeZone.findMany({
      where: {
        isActive: true,
      },
    });

    // Find zone containing the pickup point (simplified)
    let matchingZone = surgeZones.find((zone) => {
      const distance = Math.sqrt(
        Math.pow(zone.centerLat - pickupLat, 2) +
        Math.pow(zone.centerLng - pickupLng, 2)
      ) * 111000; // Rough conversion to meters
      return distance <= zone.radiusMeters;
    });

    if (matchingZone) {
      return {
        zoneName: matchingZone.name,
        demand: matchingZone.demand,
        surgeMultiplier: matchingZone.surgeMultiplier,
        activeDrivers: matchingZone.activeDrivers,
      };
    }

    return {
      demand: 30,
      surgeMultiplier: 1.0,
      activeDrivers: 50,
    };
  } catch (error) {
    console.error('Error getting surge zone:', error);
    return {
      demand: 30,
      surgeMultiplier: 1.0,
      activeDrivers: 50,
    };
  }
};

// Calculate fare with surge pricing
export const calculateFare = async (
  serviceType: string,
  distanceMeters: number,
  durationSeconds: number,
  pickupLat: number,
  pickupLng: number
): Promise<SurgeCalculationResult> => {
  const config = fareConfigs[serviceType] || fareConfigs['STANDARD_RIDE'];

  // Get surge zone data
  const surgeZone = await getSurgeZone(pickupLat, pickupLng);

  // Calculate base fare
  const distanceKm = distanceMeters / 1000;
  const durationMinutes = durationSeconds / 60;
  const baseFare =
    config.baseFare +
    (distanceKm * config.ratePerKm) +
    (durationMinutes * config.ratePerMinute);

  // Calculate surge multiplier
  const surgeMultiplier = calculateSurgeMultiplier(
    surgeZone.demand,
    surgeZone.activeDrivers,
    Math.floor(surgeZone.demand) // Simulated pending requests
  );

  // Apply surge
  const surgeFare = baseFare * surgeMultiplier;

  // Ensure minimum fare
  const estimatedFare = Math.max(surgeFare, config.minimumFare);

  return {
    baseFare: Math.round(baseFare * 100) / 100,
    surgeMultiplier: Math.round(surgeMultiplier * 10) / 10,
    surgeFare: Math.round(surgeFare * 100) / 100,
    estimatedFare: Math.round(estimatedFare * 100) / 100,
    surgeZone: surgeZone.zoneName,
    demandLevel: getDemandLevel(surgeZone.demand),
  };
};

// Update surge zone data (called periodically by background job)
export const updateSurgeZones = async () => {
  try {
    const surgeZones = await db.surgeZone.findMany({
      where: {
        isActive: true,
      },
    });

    for (const zone of surgeZones) {
      // Count recent trip requests in this zone (simplified)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentRequests = await db.trip.count({
        where: {
          createdAt: { gte: oneHourAgo },
          status: { in: ['REQUESTED', 'SEARCHING'] },
        },
      });

      // Count active drivers in zone
      const activeDrivers = await db.driver.count({
        where: {
          isOnline: true,
          currentLat: { gte: zone.centerLat - 0.05, lte: zone.centerLat + 0.05 },
          currentLng: { gte: zone.centerLng - 0.05, lte: zone.centerLng + 0.05 },
        },
      });

      // Calculate demand (0-100)
      const maxRequests = 50; // Threshold for 100% demand
      const demand = Math.min((recentRequests / maxRequests) * 100, 100);

      // Calculate surge multiplier
      const surgeMultiplier = calculateSurgeMultiplier(
        demand,
        activeDrivers,
        recentRequests
      );

      // Calculate average wait time
      const avgWaitTime = demand > 50 ? Math.floor(demand * 0.3) : Math.floor(demand * 0.1);

      // Update zone
      await db.surgeZone.update({
        where: { id: zone.id },
        data: {
          demand,
          surgeMultiplier,
          avgWaitTime,
          activeDrivers,
          updatedAt: new Date(),
        },
      });
    }

    console.log('Surge zones updated successfully');
  } catch (error) {
    console.error('Error updating surge zones:', error);
  }
};

// Get all surge zones for dashboard
export const getAllSurgeZones = async () => {
  return await db.surgeZone.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      demand: 'desc',
    },
  });
};
