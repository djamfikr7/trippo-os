import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAccessToken, generateRefreshToken, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, firstName, lastName, phone } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        role: role || 'RIDER',
        firstName,
        lastName,
        phone,
      },
    });

    // If role is DRIVER, create driver profile
    if (role === 'DRIVER') {
      await db.driver.create({
        data: {
          userId: user.id,
          licensePlate: 'PENDING',
          vehicleModel: 'PENDING',
          vehicleColor: 'PENDING',
          vehicleType: 'STANDARD',
        },
      });
    }

    // Generate tokens
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data and tokens
    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
