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

    // Get dashboard statistics
    const [
      totalRides,
      activeRides,
      completedRides,
      activeDrivers,
      totalDrivers,
      totalUsers,
      totalRevenue,
      cashCollected,
      cashPending,
    ] = await Promise.all([
      db.trip.count(),
      db.trip.count({
        where: {
          status: {
            in: ['SEARCHING', 'DRIVER_FOUND', 'ARRIVED', 'IN_PROGRESS'],
          },
        },
      }),
      db.trip.count({
        where: { status: 'COMPLETED' },
      }),
      db.driver.count({
        where: { isOnline: true },
      }),
      db.driver.count(),
      db.user.count(),
      db.transaction.aggregate({
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'CASH_PAYMENT', status: 'COLLECTED' },
        _sum: { amount: true },
      }),
      db.trip.count({
        where: {
          status: 'COMPLETED',
          isPaid: false,
        },
      }),
    ]);

    // Get rides per day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ridesByDay = await db.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM trips
      WHERE createdAt >= ${sevenDaysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY date
    `;

    // Format rides by day for chart
    const chartData = ridesByDay.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rides: Number(item.count),
    }));

    return NextResponse.json({
      totalRides,
      activeRides,
      completedRides,
      activeDrivers,
      totalDrivers,
      totalUsers,
      totalRevenue: totalRevenue._sum.amount || 0,
      cashCollected: cashCollected._sum.amount || 0,
      cashPending,
      ridesByDay: chartData,
      systemHealth: {
        database: 'HEALTHY',
        websocket: 'CONNECTED',
        osrm: 'ONLINE',
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
