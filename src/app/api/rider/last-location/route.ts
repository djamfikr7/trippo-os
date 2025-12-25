import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { lastKnownLocations } from '@/lib/storage';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get('userId');
    const userType = searchParams.get('userType') || 'DRIVER';

    // Validate parameters
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get last known location from database
    let location = null;

    if (userType === 'DRIVER') {
      const driver = await db.driver.findUnique({
        where: { userId: targetUserId },
        select: {
          currentLat: true,
          currentLng: true,
          lastLocationUpdate: true,
          isOnline: true,
        },
      });

      if (driver) {
        location = {
          userId: targetUserId,
          userType: 'DRIVER',
          lat: driver.currentLat,
          lng: driver.currentLng,
          timestamp: driver.lastLocationUpdate,
          isOnline: driver.isOnline,
          age: driver.lastLocationUpdate
            ? Math.floor((Date.now() - driver.lastLocationUpdate.getTime()) / 1000)
            : null,
        };
      }
    } else if (userType === 'RIDER') {
      // For riders, get from their most recent trip's driver location
      const recentTrip = await db.trip.findFirst({
        where: {
          riderId: targetUserId,
          status: { in: ['DRIVER_FOUND', 'ARRIVED', 'IN_PROGRESS'] },
        },
        select: {
          driver: {
            select: {
              currentLat: true,
              currentLng: true,
              lastLocationUpdate: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (recentTrip && recentTrip.driver) {
        const { driver } = recentTrip;
        location = {
          userId: driver.userId,
          userType: 'DRIVER',
          lat: driver.currentLat,
          lng: driver.currentLng,
          timestamp: driver.lastLocationUpdate,
          isOnline: true,
          age: driver.lastLocationUpdate
            ? Math.floor((Date.now() - driver.lastLocationUpdate.getTime()) / 1000)
            : null,
          driverName: `${driver.user.firstName} ${driver.user.lastName}`,
        };
      }
    }

    return NextResponse.json({
      success: true,
      location,
    });
  } catch (error: any) {
    console.error('Get last location error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Store last known location (called by WebSocket)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication (optional for this endpoint)
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

    // Validate user role (drivers can update, riders can read)
    if (payload.role !== 'DRIVER' && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only drivers and admins can update locations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      userId,
      lat,
      lng,
      heading,
      speed,
    } = body;

    // Validate parameters
    if (!userId || !lat || !lng) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Update driver's current location
    if (payload.role === 'DRIVER') {
      await db.driver.update({
        where: { userId },
        data: {
          currentLat: lat,
          currentLng: lng,
          lastLocationUpdate: new Date(),
          isOnline: true,
        },
      });
    }

    // Store in localStorage for offline use (if this is a rider request)
    if (payload.role === 'RIDER') {
      // This would be the driver's ID, not the rider's
      const driverId = userId;

      // Update client-side storage
      lastKnownLocations.set(driverId, {
        lat,
        lng,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      location: {
        userId,
        lat,
        lng,
        heading,
        speed,
        timestamp: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Update location error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
