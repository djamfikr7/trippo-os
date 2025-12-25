import { db } from '@/lib/db';

export interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  fraudType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  score: number;
  incidents: number;
  timestamp: Date;
}

export interface FraudDetectionResult {
  isFraud: boolean;
  fraudType?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  description: string;
  suggestedAction: string;
}

// Fraud detection thresholds
const FRAUD_THRESHOLDS = {
  CANCELLATION_RATE: 0.3, // 30% or higher
  RATING_DROP: 1.0, // Rating drop of 1.0 or more
  FAKE_LOCATION_THRESHOLD: 0.1, // Location jump of 0.1 degrees
  PAYMENT_AVOIDANCE_PATTERN: 3, // 3 or more cancellations after driver arrival
  ROUTE_MANIPULATION: 0.2, // 20% longer than optimal route
};

// Check for payment avoidance fraud (cancelling rides to avoid payment)
export const detectPaymentAvoidance = async (
  userId: string
): Promise<FraudDetectionResult | null> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        riderTrips: {
          where: {
            status: 'CANCELLED',
            cancelledBy: 'RIDER',
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
      },
    });

    if (!user) return null;

    const cancelledTrips = user.riderTrips;
    const recentCancellations = cancelledTrips.length;

    // Check cancellation rate
    const totalTrips = await db.trip.count({
      where: {
        riderId: userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const cancellationRate = totalTrips > 0 ? recentCancellations / totalTrips : 0;

    if (cancellationRate >= FRAUD_THRESHOLDS.CANCELLATION_RATE) {
      // Check if cancellations happen after driver found
      const cancellationsAfterDriverFound = cancelledTrips.filter(
        (trip) => trip.driverId && trip.status === 'CANCELLED'
      ).length;

      const fraudScore = Math.min(
        (cancellationsAfterDriverFound / recentCancellations) * 100,
        100
      );

      if (fraudScore > 50) {
        return {
          isFraud: true,
          fraudType: 'PAYMENT_AVOIDANCE',
          severity: fraudScore > 75 ? 'CRITICAL' : fraudScore > 50 ? 'HIGH' : 'MEDIUM',
          score: fraudScore,
          description: `User has cancelled ${recentCancellations} trips (${(cancellationRate * 100).toFixed(1)}% rate), with ${cancellationsAfterDriverFound} occurring after driver assignment`,
          suggestedAction: fraudScore > 75
            ? 'BLACKLIST_USER'
            : fraudScore > 50
            ? 'SUSPEND_USER'
            : 'SEND_WARNING',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error detecting payment avoidance:', error);
    return null;
  }
};

// Check for fake location fraud
export const detectFakeLocation = async (
  userId: string,
  currentLat: number,
  currentLng: number,
  previousLat?: number,
  previousLng?: number
): Promise<FraudDetectionResult | null> => {
  if (previousLat === undefined || previousLng === undefined) {
    return null;
  }

  try {
    // Calculate distance between locations
    const distance = Math.sqrt(
      Math.pow(currentLat - previousLat, 2) +
      Math.pow(currentLng - previousLng, 2)
    );

    // Check for impossible location jumps (>0.1 degrees = ~11km)
    if (distance > FRAUD_THRESHOLDS.FAKE_LOCATION_THRESHOLD) {
      return {
        isFraud: true,
        fraudType: 'FAKE_LOCATION',
        severity: 'HIGH',
        score: 85,
        description: `Impossible location jump detected: ${distance.toFixed(4)} degrees (~${(distance * 111).toFixed(1)}km) in a short period`,
        suggestedAction: 'SUSPEND_USER',
      };
    }

    return null;
  } catch (error) {
    console.error('Error detecting fake location:', error);
    return null;
  }
};

// Check for account takeover fraud
export const detectAccountTakeover = async (
  userId: string,
  ip: string,
  userAgent: string
): Promise<FraudDetectionResult | null> => {
  try {
    // In production, track previous IPs and user agents
    // For now, return null (would be implemented with proper tracking)

    return null;
  } catch (error) {
    console.error('Error detecting account takeover:', error);
    return null;
  }
};

// Check for route manipulation fraud (drivers taking longer routes)
export const detectRouteManipulation = async (
  tripId: string,
  actualDistance: number,
  optimalDistance: number
): Promise<FraudDetectionResult | null> => {
  try {
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!trip || !trip.driver) return null;

    // Check if actual route is significantly longer than optimal
    const distanceRatio = actualDistance / optimalDistance;

    if (distanceRatio > 1 + FRAUD_THRESHOLDS.ROUTE_MANIPULATION) {
      return {
        isFraud: true,
        fraudType: 'ROUTE_MANIPULATION',
        severity: distanceRatio > 1.5 ? 'HIGH' : 'MEDIUM',
        score: Math.min((distanceRatio - 1) * 100, 90),
        description: `Route manipulation detected: Actual distance ${actualDistance}m is ${((distanceRatio - 1) * 100).toFixed(1)}% longer than optimal ${optimalDistance}m`,
        suggestedAction: distanceRatio > 1.5 ? 'DOWNGRADE_DRIVER' : 'SEND_WARNING',
      };
    }

    return null;
  } catch (error) {
    console.error('Error detecting route manipulation:', error);
    return null;
  }
};

// Comprehensive fraud detection for a trip
export const detectTripFraud = async (
  tripId: string
): Promise<FraudDetectionResult[]> => {
  const results: FraudDetectionResult[] = [];

  try {
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      include: {
        rider: true,
        driver: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!trip) return results;

    // Check rider for payment avoidance
    if (trip.status === 'CANCELLED' && trip.cancelledBy === 'RIDER') {
      const paymentAvoidance = await detectPaymentAvoidance(trip.riderId);
      if (paymentAvoidance) {
        results.push(paymentAvoidance);
      }
    }

    // Check driver for route manipulation
    if (trip.status === 'COMPLETED' && trip.driver) {
      // Simulate optimal distance (in production, use routing API)
      const optimalDistance = trip.distanceMeters * 0.9; // Assume 10% variance is acceptable
      const routeManipulation = await detectRouteManipulation(
        tripId,
        trip.distanceMeters,
        optimalDistance
      );
      if (routeManipulation) {
        results.push(routeManipulation);
      }
    }

    return results;
  } catch (error) {
    console.error('Error detecting trip fraud:', error);
    return results;
  }
};

// Create fraud report
export const createFraudReport = async (
  fraudDetectionResult: FraudDetectionResult,
  userId: string,
  tripId?: string,
  reportedBy: string = 'SYSTEM'
): Promise<void> => {
  try {
    await db.fraudReport.create({
      data: {
        userId,
        fraudType: fraudDetectionResult.fraudType || 'OTHER',
        severity: fraudDetectionResult.severity || 'MEDIUM',
        description: fraudDetectionResult.description,
        evidence: JSON.stringify({
          score: fraudDetectionResult.score,
          suggestedAction: fraudDetectionResult.suggestedAction,
          tripId,
        }),
        tripId,
        reportedBy,
      },
    });

    // Update user trust score
    await updateUserTrustScore(userId, fraudDetectionResult.score);
  } catch (error) {
    console.error('Error creating fraud report:', error);
  }
};

// Update user trust score based on fraud detection
const updateUserTrustScore = async (
  userId: string,
  fraudScore: number
): Promise<void> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    // Deduct from trust score based on fraud severity
    const trustReduction = Math.floor(fraudScore * 0.5);
    const newTrustScore = Math.max(user.trustScore - trustReduction, 0);

    await db.user.update({
      where: { id: userId },
      data: {
        trustScore: newTrustScore,
        status: fraudScore > 75 ? 'UNDER_REVIEW' : user.status,
      },
    });

    // If trust score is very low, suspend user
    if (newTrustScore < 30) {
      await db.user.update({
        where: { id: userId },
        data: {
          status: 'SUSPENDED',
        },
      });
    }
  } catch (error) {
    console.error('Error updating trust score:', error);
  }
};

// Get all fraud alerts for dashboard
export const getFraudAlerts = async (
  limit: number = 50,
  offset: number = 0
): Promise<FraudAlert[]> => {
  try {
    const fraudReports = await db.fraudReport.findMany({
      include: {
        user: true,
      },
      where: {
        status: {
          in: ['PENDING', 'REVIEWING'],
        },
      },
      orderBy: {
        reportedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return fraudReports.map((report) => ({
      id: report.id,
      userId: report.userId,
      userName: `${report.user.firstName} ${report.user.lastName}`,
      fraudType: report.fraudType,
      severity: report.severity as any,
      description: report.description,
      score: report.evidence ? JSON.parse(report.evidence).score || 0 : 0,
      incidents: 1, // Simplified
      timestamp: report.reportedAt,
    }));
  } catch (error) {
    console.error('Error getting fraud alerts:', error);
    return [];
  }
};

// Run automated fraud detection (should be scheduled job)
export const runAutomatedFraudDetection = async (): Promise<void> => {
  try {
    console.log('Running automated fraud detection...');

    // Get users with high cancellation rates
    const users = await db.user.findMany({
      include: {
        riderTrips: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        },
      },
    });

    for (const user of users) {
      const paymentAvoidance = await detectPaymentAvoidance(user.id);
      if (paymentAvoidance && paymentAvoidance.isFraud) {
        await createFraudReport(paymentAvoidance, user.id);
      }
    }

    console.log('Automated fraud detection completed');
  } catch (error) {
    console.error('Error running automated fraud detection:', error);
  }
};
