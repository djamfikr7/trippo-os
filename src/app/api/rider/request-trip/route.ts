import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { calculateFare } from '@/lib/surge-pricing';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Validate user role
    if (payload.role !== 'RIDER') {
      return NextResponse.json(
        { error: 'Only riders can request trips' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      serviceType,
      pickupLat,
      pickupLng,
      pickupAddress,
      dropoffLat,
      dropoffLng,
      dropoffAddress,
      paymentMethod,
    } = body;

    // Validate required fields
    if (
      !serviceType ||
      !pickupLat ||
      !pickupLng ||
      !pickupAddress ||
      !dropoffLat ||
      !dropoffLng ||
      !dropoffAddress
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate coordinates
    const coords = [
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    ];

    for (const coord of coords) {
      if (isNaN(coord) || coord < -90 || coord > 90) {
        return NextResponse.json(
          { error: 'Invalid coordinates' },
          { status: 400 }
        );
      }
    }

    // Calculate fare with surge pricing
    const distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    const duration = estimateDuration(distance);

    const fareResult = await calculateFare(
      serviceType,
      distance,
      duration,
      pickupLat,
      pickupLng
    );

    // Create trip in database
    const trip = await db.trip.create({
      data: {
        riderId: payload.userId,
        status: 'REQUESTED',
        serviceType,
        pickupLat,
        pickupLng,
        pickupAddress,
        dropoffLat,
        dropoffLng,
        dropoffAddress,
        distanceMeters: Math.round(distance),
        durationSeconds: Math.round(duration),
        baseFare: fareResult.baseFare,
        surgeMultiplier: fareResult.surgeMultiplier,
        fare: fareResult.surgeFare,
        estimatedFare: fareResult.estimatedFare,
        paymentMethod: paymentMethod || 'CASH',
        isPaid: false,
      },
    });

    // Check for fraud (high cancellation rate, etc.)
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (user && user.cancellationsThisMonth > 5) {
      // Potential fraud - flag for review
      console.log(`User ${payload.userId} has high cancellation rate: ${user.cancellationsThisMonth}`);
    }

    return NextResponse.json({
      success: true,
      trip: {
        id: trip.id,
        riderId: payload.userId,
        status: trip.status,
        serviceType,
        pickup: {
          lat: pickupLat,
          lng: pickupLng,
          address: pickupAddress,
        },
        dropoff: {
          lat: dropoffLat,
          lng: dropoffLng,
          address: dropoffAddress,
        },
        distance: {
          meters: Math.round(distance),
          km: Math.round(distance / 10) / 100,
        },
        duration: {
          seconds: Math.round(duration),
          minutes: Math.floor(duration / 60),
        },
        pricing: {
          baseFare: fareResult.baseFare,
          surgeMultiplier: fareResult.surgeMultiplier,
          surgeFare: fareResult.surgeFare,
          estimatedFare: fareResult.estimatedFare,
          demandLevel: fareResult.demandLevel,
          surgeZone: fareResult.surgeZone,
        },
        paymentMethod,
        isPaid: false,
        createdAt: trip.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Ride request error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Calculate distance using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Estimate duration based on distance (simplified)
function estimateDuration(distance: number): number {
  // Average city speed: 30 km/h = 8.33 m/s
  const avgSpeed = 30 * 1000 / 3600;
  return distance / avgSpeed;
}
