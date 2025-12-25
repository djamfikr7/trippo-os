import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getFraudAlerts, runAutomatedFraudDetection } from '@/lib/fraud-detection';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');

    // Get fraud alerts
    const fraudReports = await db.fraudReport.findMany({
      include: {
        user: true,
      },
      where: severity ? { severity: severity.toUpperCase() } : undefined,
      orderBy: {
        reportedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await db.fraudReport.count({
      where: severity ? { severity: severity.toUpperCase() } : undefined,
    });

    return NextResponse.json({
      alerts: fraudReports.map((report) => ({
        id: report.id,
        userId: report.userId,
        userName: `${report.user.firstName} ${report.user.lastName}`,
        userEmail: report.user.email,
        fraudType: report.fraudType,
        severity: report.severity,
        description: report.description,
        evidence: report.evidence ? JSON.parse(report.evidence) : null,
        status: report.status,
        tripId: report.tripId,
        reportedBy: report.reportedBy,
        reportedAt: report.reportedAt,
        resolvedAt: report.resolvedAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get fraud alerts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Run fraud detection manually
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
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
    const { action } = body;

    if (action === 'RUN_DETECTION') {
      // Run automated fraud detection
      await runAutomatedFraudDetection();

      return NextResponse.json({
        success: true,
        message: 'Fraud detection scan completed',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Fraud detection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update fraud report status
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
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
    const { reportId, status, action } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'Report ID and status are required' },
        { status: 400 }
      );
    }

    // Update fraud report
    const updatedReport = await db.fraudReport.update({
      where: { id: reportId },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' || status === 'DISMISSED' ? new Date() : null,
      },
    });

    // Apply actions based on status
    if (action && action === 'SUSPEND_USER') {
      const report = await db.fraudReport.findUnique({
        where: { id: reportId },
      });

      if (report) {
        await db.user.update({
          where: { id: report.userId },
          data: {
            status: 'SUSPENDED',
          },
        });
      }
    } else if (action && action === 'BLACKLIST_USER') {
      const report = await db.fraudReport.findUnique({
        where: { id: reportId },
      });

      if (report) {
        await db.user.update({
          where: { id: report.userId },
          data: {
            status: 'BLACKLISTED',
          },
        });

        // Create blacklist entry
        await db.blacklistEntry.create({
          data: {
            userId: report.userId,
            blacklistType: 'PERMANENT',
            reason: report.description,
            blacklistedBy: payload.userId,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    console.error('Update fraud report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
