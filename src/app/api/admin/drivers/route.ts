import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // online, offline, all
    const vehicleType = searchParams.get('vehicleType');

    // Build filter
    const where: any = {};
    if (status === 'online') {
      where.isOnline = true;
    } else if (status === 'offline') {
      where.isOnline = false;
    }
    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    // Get drivers
    const drivers = await db.driver.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isVerified: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      drivers: drivers.map(driver => ({
        id: driver.id,
        licensePlate: driver.licensePlate,
        vehicleModel: driver.vehicleModel,
        vehicleColor: driver.vehicleColor,
        vehicleType: driver.vehicleType,
        isOnline: driver.isOnline,
        isVerified: driver.isVerified,
        rating: driver.rating,
        totalTrips: driver.totalTrips,
        currentLat: driver.currentLat,
        currentLng: driver.currentLng,
        user: driver.user,
      })),
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { driverId, action } = body;

    if (!driverId || !action) {
      return NextResponse.json(
        { error: 'Driver ID and action are required' },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === 'verify') {
      const driver = await db.driver.update({
        where: { id: driverId },
        data: { isVerified: true },
        include: {
          user: true,
        },
      });

      return NextResponse.json({
        success: true,
        driver: {
          id: driver.id,
          isVerified: driver.isVerified,
          user: driver.user,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update driver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
