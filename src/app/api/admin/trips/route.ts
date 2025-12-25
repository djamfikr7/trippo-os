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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get trips
    const trips = await db.trip.findMany({
      where,
      include: {
        rider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        transactions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await db.trip.count({ where });

    return NextResponse.json({
      trips: trips.map(trip => ({
        id: trip.id,
        status: trip.status,
        pickupAddress: trip.pickupAddress,
        pickupLat: trip.pickupLat,
        pickupLng: trip.pickupLng,
        dropoffAddress: trip.dropoffAddress,
        dropoffLat: trip.dropoffLat,
        dropoffLng: trip.dropoffLng,
        distanceMeters: trip.distanceMeters,
        durationSeconds: trip.durationSeconds,
        fare: trip.fare,
        paymentMethod: trip.paymentMethod,
        isPaid: trip.isPaid,
        createdAt: trip.createdAt,
        startedAt: trip.startedAt,
        completedAt: trip.completedAt,
        rider: trip.rider,
        driver: trip.driver ? {
          id: trip.driver.id,
          licensePlate: trip.driver.licensePlate,
          vehicleModel: trip.driver.vehicleModel,
          vehicleColor: trip.driver.vehicleColor,
          user: trip.driver.user,
        } : null,
        transactions: trip.transactions,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get trips error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
