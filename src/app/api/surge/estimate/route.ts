import { NextRequest, NextResponse } from 'next/server';
import { calculateFare, getAllSurgeZones } from '@/lib/surge-pricing';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceType = searchParams.get('serviceType') || 'STANDARD_RIDE';
    const pickupLat = parseFloat(searchParams.get('pickupLat') || '0');
    const pickupLng = parseFloat(searchParams.get('pickupLng') || '0');
    const dropoffLat = parseFloat(searchParams.get('dropoffLat') || '0');
    const dropoffLng = parseFloat(searchParams.get('dropoffLng') || '0');

    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Calculate distance (simplified Haversine formula)
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (pickupLat * Math.PI) / 180;
    const φ2 = (dropoffLat * Math.PI) / 180;
    const Δφ = ((dropoffLat - pickupLat) * Math.PI) / 180;
    const Δλ = ((dropoffLng - pickupLng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = R * c;

    // Estimate duration (simplified: 1km = 2 minutes in city traffic)
    const durationSeconds = Math.floor((distanceMeters / 1000) * 120);

    // Calculate fare with surge
    const fareResult = await calculateFare(
      serviceType,
      distanceMeters,
      durationSeconds,
      pickupLat,
      pickupLng
    );

    return NextResponse.json({
      pickup: { lat: pickupLat, lng: pickupLng },
      dropoff: { lat: dropoffLat, lng: dropoffLng },
      distance: {
        meters: Math.round(distanceMeters),
        km: Math.round(distanceMeters / 10) / 100,
      },
      duration: {
        seconds: durationSeconds,
        minutes: Math.floor(durationSeconds / 60),
      },
      pricing: fareResult,
    });
  } catch (error) {
    console.error('Estimate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get all surge zones for admin dashboard
export async function POST(request: NextRequest) {
  try {
    const surgeZones = await getAllSurgeZones();

    return NextResponse.json({
      surgeZones: surgeZones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        center: {
          lat: zone.centerLat,
          lng: zone.centerLng,
        },
        radiusMeters: zone.radiusMeters,
        demand: zone.demand,
        surgeMultiplier: zone.surgeMultiplier,
        avgWaitTime: zone.avgWaitTime,
        activeDrivers: zone.activeDrivers,
        isActive: zone.isActive,
        updatedAt: zone.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get surge zones error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
