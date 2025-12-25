// WebSocket Service for Trippo.OS
// Handles real-time updates for drivers, riders, and admin

import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const PORT = 3003;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:../../db/custom.db',
    },
  },
});

interface LocationUpdate {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

interface TripRequest {
  tripId: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  fare: number;
  serviceType: string;
  surgeMultiplier: number;
  estimatedDuration: number;
}

interface SOSAlert {
  alertId: string;
  userId: string;
  userType: 'RIDER' | 'DRIVER';
  type: 'EMERGENCY' | 'SAFETY' | 'MEDICAL' | 'ACCIDENT';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  timestamp: Date;
  message: string;
}

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  path: '/',
});

// Store connected users
const connectedUsers = new Map<string, string>();
// Store last known locations
const lastKnownLocations = new Map<string, { lat: number; lng: number; timestamp: Date }>();

console.log(`🚀 WebSocket Server running on port ${PORT}`);

io.on('connection', (socket) => {
  const { userId, userType } = socket.handshake.query as {
    userId: string;
    userType: 'RIDER' | 'DRIVER' | 'ADMIN';
  };

  if (!userId || !userType) {
    socket.disconnect();
    return;
  }

  console.log(`✅ Connected: ${userType} - ${userId}`);
  connectedUsers.set(socket.id, userId);

  // Join appropriate room
  const room = `${userType.toLowerCase()}_${userId}`;
  socket.join(room);

  // If driver, also join driver room
  if (userType === 'DRIVER') {
    socket.join(`driver_${userId}`);
  }

  // Send initial connection confirmation
  socket.emit('connected', {
    socketId: socket.id,
    serverTime: new Date().toISOString(),
  });

  // Handle driver location updates
  socket.on('update_location', async (data: LocationUpdate) => {
    try {
      const { driverId, lat, lng, heading, speed } = data;

      // Update database
      await prisma.driver.update({
        where: { userId: driverId },
        data: {
          currentLat: lat,
          currentLng: lng,
          lastLocationUpdate: new Date(),
        },
      });

      // Store last known location for SOS
      lastKnownLocations.set(driverId, { lat, lng, timestamp: new Date() });

      // Broadcast to riders in this driver's active trips
      const activeTrips = await prisma.trip.findMany({
        where: {
          driverId,
          status: { in: ['DRIVER_FOUND', 'ARRIVED', 'IN_PROGRESS'] },
        },
        select: { riderId: true },
      });

      activeTrips.forEach((trip) => {
        io.to(`rider_${trip.riderId}`).emit('driver_location_updated', {
          driverId,
          lat,
          lng,
          heading,
          speed,
          timestamp: new Date(),
        });
      });

      // Notify admin
      io.to('admin').emit('driver_moved', {
        driverId,
        lat,
        lng,
        timestamp: new Date(),
      });

      console.log(`📍 Location updated: ${driverId} at [${lat}, ${lng}]`);
    } catch (error) {
      console.error('Error updating location:', error);
      socket.emit('error', {
        type: 'LOCATION_UPDATE_FAILED',
        message: 'Failed to update location',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Handle driver going online
  socket.on('go_online', async (driverId: string) => {
    try {
      await prisma.driver.update({
        where: { userId: driverId },
        data: { isOnline: true },
      });

      // Broadcast availability
      io.emit('driver_online', { driverId, timestamp: new Date() });
      console.log(`🟢 Driver online: ${driverId}`);
    } catch (error) {
      socket.emit('error', { type: 'GO_ONLINE_FAILED', message: 'Failed to go online' });
    }
  });

  // Handle driver going offline
  socket.on('go_offline', async (driverId: string) => {
    try {
      await prisma.driver.update({
        where: { userId: driverId },
        data: { isOnline: false, currentLat: null, currentLng: null },
      });

      // Broadcast offline status
      io.emit('driver_offline', { driverId, timestamp: new Date() });
      console.log(`🔴 Driver offline: ${driverId}`);
    } catch (error) {
      socket.emit('error', { type: 'GO_OFFLINE_FAILED', message: 'Failed to go offline' });
    }
  });

  // Handle trip requests (from riders)
  socket.on('request_trip', async (data: TripRequest) => {
    try {
      // Find nearby drivers
      const nearbyDrivers = await findNearbyDrivers(
        data.pickupLat,
        data.pickupLng,
        data.serviceType
      );

      // Notify nearby drivers
      nearbyDrivers.forEach((driver) => {
        const distance = calculateDistance(
          { lat: driver.currentLat!, lng: driver.currentLng! },
          { lat: data.pickupLat, lng: data.pickupLng }
        );

        io.to(`driver_${driver.userId}`).emit('new_trip_request', {
          ...data,
          distanceToPickup: distance,
          estimatedTimeToPickup: Math.floor(distance / 1000 * 60 * 0.5), // Rough estimate
          timestamp: new Date(),
          timeout: 30, // 30 seconds to respond
          priority: calculateTripPriority(driver.rating!, driver.tier!),
          intercityEligible: driver.eligibleForIntercity,
          suggestedRoute: await getOptimalRoute(
            { lat: driver.currentLat!, lng: driver.currentLng! },
            { lat: data.pickupLat, lng: data.pickupLng },
            { lat: data.dropoffLat, lng: data.dropoffLng }
          ),
        });
      });

      // Acknowledge to rider
      io.to(`rider_${data.riderId}`).emit('trip_request_sent', {
        tripId: data.tripId,
        nearbyDriversCount: nearbyDrivers.length,
        estimatedPickupTime: Math.floor(Math.random() * 5) + 3,
        timestamp: new Date(),
      });

      // Notify admin
      io.to('admin').emit('trip_requested', {
        ...data,
        notifiedDrivers: nearbyDrivers.length,
        timestamp: new Date(),
      });

      console.log(`🚗 New trip request: ${data.tripId} - ${nearbyDrivers.length} drivers notified`);
    } catch (error) {
      console.error('Error requesting trip:', error);
      socket.emit('error', {
        type: 'TRIP_REQUEST_FAILED',
        message: 'Failed to request trip',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Handle driver accepting trip
  socket.on('accept_trip', async (data: { tripId: string; driverId: string }) => {
    try {
      const { tripId, driverId } = data;

      // Update trip status
      const trip = await prisma.trip.update({
        where: { id: tripId },
        data: {
          driverId,
          status: 'DRIVER_FOUND',
        },
        include: { rider: true },
      });

      // Notify rider
      const driver = await prisma.driver.findUnique({
        where: { userId: driverId },
        include: { user: true },
      });

      if (driver && trip) {
        io.to(`rider_${trip.riderId}`).emit('driver_found', {
          tripId,
          driver: {
            id: driverId,
            name: `${driver.user.firstName} ${driver.user.lastName}`,
            phone: driver.user.phone,
            vehicle: {
              model: driver.vehicleModel,
              color: driver.vehicleColor,
              type: driver.vehicleType,
              plate: driver.licensePlate,
            },
            rating: driver.rating,
            photo: driver.user.avatar,
            estimatedArrival: Math.floor(Math.random() * 8) + 2, // 2-10 minutes
          },
          timestamp: new Date(),
        });

        // Notify admin
        io.to('admin').emit('trip_accepted', {
          tripId,
          driverId,
          timestamp: new Date(),
        });

        console.log(`✅ Trip accepted: ${tripId} by ${driverId}`);
      }
    } catch (error) {
      console.error('Error accepting trip:', error);
      socket.emit('error', {
        type: 'ACCEPT_TRIP_FAILED',
        message: 'Failed to accept trip',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Handle driver arriving at pickup
  socket.on('driver_arrived', async (data: { tripId: string; driverId: string }) => {
    try {
      await prisma.trip.update({
        where: { id: data.tripId },
        data: { status: 'ARRIVED' },
      });

      // Notify rider
      const trip = await prisma.trip.findUnique({
        where: { id: data.tripId },
        select: { riderId: true },
      });

      if (trip) {
        io.to(`rider_${trip.riderId}`).emit('trip_status_updated', {
          tripId: data.tripId,
          status: 'ARRIVED',
          message: 'Your driver has arrived at the pickup location',
          timestamp: new Date(),
        });
      }

      // Notify admin
      io.to('admin').emit('trip_arrived', {
        tripId: data.tripId,
        timestamp: new Date(),
      });

      console.log(`📍 Driver arrived: ${data.tripId}`);
    } catch (error) {
      console.error('Error arriving at pickup:', error);
      socket.emit('error', {
        type: 'ARRIVED_FAILED',
        message: 'Failed to update trip status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Handle trip started
  socket.on('start_trip', async (data: { tripId: string }) => {
    try {
      await prisma.trip.update({
        where: { id: data.tripId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // Notify all parties
      io.to(`trip_${data.tripId}`).emit('trip_status_updated', {
        tripId: data.tripId,
        status: 'IN_PROGRESS',
        message: 'Trip has started',
        timestamp: new Date(),
      });

      io.to('admin').emit('trip_started', {
        tripId: data.tripId,
        timestamp: new Date(),
      });

      console.log(`🚗 Trip started: ${data.tripId}`);
    } catch (error) {
      console.error('Error starting trip:', error);
      socket.emit('error', {
        type: 'START_TRIP_FAILED',
        message: 'Failed to start trip',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Handle trip completed
  socket.on('complete_trip', async (data: { tripId: string; driverId: string; fareCollected: boolean }) => {
    try {
      await prisma.trip.update({
        where: { id: data.tripId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          isPaid: data.fareCollected,
        },
      });

      // Update driver stats
      if (data.fareCollected) {
        await prisma.driver.update({
          where: { userId: data.driverId },
          data: {
            totalTrips: { increment: 1 },
            completions: { increment: 1 },
            meritScore: { increment: 10 },
          },
        });
      }

      // Notify rider
      io.to(`trip_${data.tripId}`).emit('trip_status_updated', {
        tripId: data.tripId,
        status: 'COMPLETED',
        message: 'Trip completed successfully',
        fareCollected: data.fareCollected,
        timestamp: new Date(),
      });

      // Notify admin
      io.to('admin').emit('trip_completed', {
        tripId: data.tripId,
        driverId: data.driverId,
        fareCollected: data.fareCollected,
        timestamp: new Date(),
      });

      console.log(`✅ Trip completed: ${data.tripId}`);
    } catch (error) {
      console.error('Error completing trip:', error);
      socket.emit('error', {
        type: 'COMPLETE_TRIP_FAILED',
        message: 'Failed to complete trip',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Handle trip cancellation
  socket.on('cancel_trip', async (data: { tripId: string; userId: string; cancelledBy: string; reason?: string }) => {
    try {
      await prisma.trip.update({
        where: { id: data.tripId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: data.cancelledBy,
          cancelReason: data.reason,
        },
      });

      // Update user cancellation count
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          cancellationsThisMonth: { increment: 1 },
          lastCancellationAt: new Date(),
        },
      });

      // Notify all parties
      io.to(`trip_${data.tripId}`).emit('trip_cancelled', {
        tripId: data.tripId,
        cancelledBy: data.cancelledBy,
        reason: data.reason,
        timestamp: new Date(),
      });

      io.to('admin').emit('trip_cancelled', {
        tripId: data.tripId,
        cancelledBy: data.cancelledBy,
        reason: data.reason,
        timestamp: new Date(),
      });

      console.log(`❌ Trip cancelled: ${data.tripId} by ${data.cancelledBy}`);
    } catch (error) {
      console.error('Error cancelling trip:', error);
      socket.emit('error', {
        type: 'CANCEL_TRIP_FAILED',
        message: 'Failed to cancel trip',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Handle SOS/Emergency alerts
  socket.on('sos_alert', async (data: SOSAlert) => {
    try {
      const { alertId, userId, userType, type, location, timestamp, message } = data;

      console.log(`🚨 SOS ALERT: ${type} from ${userType} ${userId}`);

      // Get last known location if not provided
      let alertLocation = location;
      if (!alertLocation && userType === 'DRIVER') {
        const lastLoc = lastKnownLocations.get(userId);
        if (lastLoc) {
          alertLocation = {
            lat: lastLoc.lat,
            lng: lastLoc.lng,
            address: 'Last known location',
          };
        }
      }

      // Notify nearby drivers
      if (userType === 'RIDER') {
        const nearbyDrivers = await findNearbyDrivers(
          alertLocation.lat,
          alertLocation.lng,
          'STANDARD_RIDE'
        );

        nearbyDrivers.slice(0, 5).forEach((driver) => {
          const distance = calculateDistance(
            { lat: driver.currentLat!, lng: driver.currentLng! },
            { lat: alertLocation.lat, lng: alertLocation.lng }
          );

          io.to(`driver_${driver.userId}`).emit('sos_nearby', {
            alertId,
            riderId: userId,
            type,
            location: alertLocation,
            message,
            timestamp: new Date(),
            distanceToAlert: distance,
          });
        });
      }

      // Notify admin
      io.to('admin').emit('sos_alert', {
        ...data,
        location: alertLocation,
        timestamp: new Date(),
      });

      // Acknowledge to sender
      socket.emit('sos_acknowledged', {
        alertId,
        message: 'Emergency services and nearby drivers have been notified',
        timestamp: new Date(),
      });

      console.log(`🚨 SOS processed - alerted ${userType === 'RIDER' ? 'nearby drivers' : 'admin'}`);
    } catch (error) {
      console.error('Error processing SOS:', error);
      socket.emit('error', {
        type: 'SOS_FAILED',
        message: 'Failed to process SOS alert',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Handle last location requests
  socket.on('get_last_location', async (data: { userId: string; requesterId: string; userType: string }) => {
    try {
      const lastLoc = lastKnownLocations.get(data.userId);

      if (lastLoc) {
        // Send to requester
        const requesterRoom = `${data.userType.toLowerCase()}_${data.requesterId}`;
        io.to(requesterRoom).emit('last_location_response', {
          userId: data.userId,
          location: {
            lat: lastLoc.lat,
            lng: lastLoc.lng,
            timestamp: lastLoc.timestamp,
            age: Math.floor((Date.now() - lastLoc.timestamp.getTime()) / 1000), // seconds ago
          },
        });
      } else {
        io.to(`${data.userType.toLowerCase()}_${data.requesterId}`).emit('last_location_response', {
          userId: data.userId,
          location: null,
        });
      }
    } catch (error) {
      console.error('Error getting last location:', error);
    }
  });

  // Handle heartbeat/ping
  socket.on('ping', () => {
    socket.emit('pong', {
      timestamp: new Date(),
    });
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    const userId = connectedUsers.get(socket.id);
    console.log(`❌ Disconnected: ${userId}`);

    if (userId) {
      connectedUsers.delete(socket.id);

      // If driver, mark as offline after delay
      try {
        const driver = await prisma.driver.findUnique({
          where: { userId },
        });

        if (driver) {
          // Wait 30 seconds before marking offline (in case of reconnection)
          setTimeout(async () => {
            // Check if still disconnected
            const stillConnected = Array.from(connectedUsers.values()).includes(userId);
            if (!stillConnected && driver.isOnline) {
              await prisma.driver.update({
                where: { userId },
                data: {
                  isOnline: false,
                  currentLat: null,
                  currentLng: null,
                },
              });
              io.emit('driver_offline', { driverId: userId, timestamp: new Date() });
              console.log(`🔴 Driver went offline (timeout): ${userId}`);
            }
          }, 30000);
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    }
  });
});

// Helper functions
async function findNearbyDrivers(pickupLat: number, pickupLng: number, serviceType: string) {
  try {
    const drivers = await prisma.driver.findMany({
      where: {
        isOnline: true,
        vehicleType: serviceType as any,
      },
      include: {
        user: true,
      },
      take: 10, // Limit to nearest 10
    });

    // Filter by distance (simplified)
    const nearbyDrivers = drivers
      .filter((driver) => {
        if (!driver.currentLat || !driver.currentLng) return false;
        const distance = calculateDistance(
          { lat: driver.currentLat, lng: driver.currentLng },
          { lat: pickupLat, lng: pickupLng }
        );
        return distance <= 5000; // Within 5km
      })
      .sort((a, b) => {
        const distA = calculateDistance(
          { lat: a.currentLat!, lng: a.currentLng! },
          { lat: pickupLat, lng: pickupLng }
        );
        const distB = calculateDistance(
          { lat: b.currentLat!, lng: b.currentLng! },
          { lat: pickupLat, lng: pickupLng }
        );
        return distA - distB;
      });

    return nearbyDrivers;
  } catch (error) {
    console.error('Error finding nearby drivers:', error);
    return [];
  }
}

function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

function calculateTripPriority(rating: number, tier: string): number {
  let priority = 50; // Base priority

  // Rating bonus
  priority += (rating - 3.5) * 20;

  // Tier bonus
  const tierBonus: Record<string, number> = {
    BRONZE: 0,
    SILVER: 10,
    GOLD: 20,
    PLATINUM: 30,
    DIAMOND: 40,
  };

  priority += tierBonus[tier] || 0;

  return Math.min(Math.max(priority, 0), 100);
}

// Mock OSRM route call (in production, call actual API)
async function getOptimalRoute(
  from: { lat: number; lng: number },
  via: { lat: number; lng: number },
  to: { lat: number; lng: number }
) {
  try {
    const response = await fetch(
      `http://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${via.lng},${via.lat};${to.lng},${to.lat}?overview=false&geometries=geojson`,
      { signal: AbortSignal.timeout(5000) } // 5 second timeout
    );

    if (!response.ok) {
      console.warn('OSRM API not reachable, using fallback');
      return null;
    }

    const data = await response.json();

    if (data.code === 'Ok') {
      const route = data.routes[0];
      return {
        distance: route.distance, // meters
        duration: route.duration, // seconds
        geometry: route.geometry,
        legs: route.legs,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching OSRM route:', error);
    return null;
  }
}

// Mock traffic info (in production, integrate real traffic API)
async function getTrafficInfo(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) {
  // In production, use Google Traffic, Mapbox, or similar
  return {
    congestionLevel: 'LOW', // LOW, MEDIUM, HIGH
    alternativeRoutesAvailable: false,
    estimatedDelay: 0, // seconds
  };
}

export default io;
