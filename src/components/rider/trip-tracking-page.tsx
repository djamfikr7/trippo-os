'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  Shield,
  AlertTriangle,
  RefreshCw,
  MessageCircle,
  X,
  CheckCircle2,
  AlertCircle as AlertCircleIcon,
  User,
  Car as CarIcon,
} from 'lucide-react';
import { useTrip } from '@/lib/api';

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export function RiderTripTracking() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [trip, setTrip] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [tripStatus, setTripStatus] = useState<string>('');
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number; timestamp: Date } | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showSOS, setShowSOS] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; from: string; timestamp: Date }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock trip ID - in production, get from URL or storage
  const tripId = 'TRP-001';

  // Fetch trip data
  const { data: tripData, isLoading } = useTrip(tripId);

  useEffect(() => {
    if (tripData) {
      setTrip(tripData);
      setTripStatus(tripData.status);
    }
  }, [tripData]);

  // Connect to WebSocket
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      setConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      setConnectionError('Failed to connect to server. Retrying...');
    });

    // Listen for driver location updates
    newSocket.on('driver_location_updated', (data: DriverLocation) => {
      console.log('Driver location updated:', data);
      setDriverLocation(data);
      setLastLocation({
        lat: data.lat,
        lng: data.lng,
        timestamp: data.timestamp || new Date(),
      });

      // Update ETA based on speed and distance
      if (driverLocation && trip) {
        const distance = calculateDistance(
          { lat: data.lat, lng: data.lng },
          { lat: trip.pickupLat, lng: trip.pickupLng }
        );
        if (data.speed) {
          const timeInSeconds = distance / data.speed;
          setEta(Math.floor(timeInSeconds / 60));
        }
      }
    });

    // Listen for trip status updates
    newSocket.on('trip_status_updated', (data: any) => {
      console.log('Trip status updated:', data);
      setTripStatus(data.status);
      setTrip((prev: any) => ({ ...prev, status: data.status }));

      // Auto-scroll to messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Listen for driver found
    newSocket.on('driver_found', (data: any) => {
      console.log('Driver found:', data);
      setDriverInfo(data.driver);
      setTrip((prev: any) => ({ ...prev, driver: data.driver }));
    });

    // Listen for trip cancelled
    newSocket.on('trip_cancelled', (data: any) => {
      console.log('Trip cancelled:', data);
      setTripStatus('CANCELLED');
      setTrip((prev: any) => ({ ...prev, status: 'CANCELLED', cancelReason: data.reason }));
    });

    // Listen for SOS response
    newSocket.on('sos_acknowledged', (data: any) => {
      console.log('SOS acknowledged:', data);
      setSosSent(true);
      setTimeout(() => {
        setShowSOS(false);
        setSosSent(false);
      }, 5000);
    });

    // Handle reconnection
    newSocket.io.on('reconnect', (attemptNumber: number) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      setConnectionError(null);
    });

    newSocket.io.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      setConnectionError(`Reconnecting... (${attemptNumber}/5)`);
    });

    newSocket.io.on('reconnect_failed', () => {
      console.error('Failed to reconnect to server');
      setConnectionError('Failed to connect to server. Please check your connection.');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Send location updates periodically (if this is a rider tracking their own location)
  useEffect(() => {
    if (connected && trip && ['SEARCHING', 'DRIVER_FOUND'].includes(trip.status)) {
      // Get user's location
      if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
          (position) => {
            // Send to server
            socket?.emit('update_rider_location', {
              tripId,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              heading: position.coords.heading,
              speed: position.coords.speed,
              accuracy: position.coords.accuracy,
              timestamp: new Date(),
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      }
    }
  }, [connected, trip, socket]);

  // Send message
  const handleSendMessage = () => {
    if (!message.trim() || !socket) return;

    const newMessage = {
      text: message,
      from: 'RIDER',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    socket.emit('send_message', {
      tripId,
      ...newMessage,
    });

    setMessage('');
  };

  // Handle SOS
  const handleSOS = () => {
    if (!socket) return;

    // Get last known driver location
    const location = lastLocation || driverLocation;
    const locData = location
      ? {
          lat: location.lat,
          lng: location.lng,
          address: 'Last known location',
        }
      : {
          lat: trip?.pickupLat || 0,
          lng: trip?.pickupLng || 0,
          address: trip?.pickupAddress || 'Unknown',
        };

    socket.emit('sos_alert', {
      alertId: `SOS-${Date.now()}`,
      userId: 'RIDER-001', // In production, get from auth
      userType: 'RIDER',
      type: 'EMERGENCY',
      location: locData,
      timestamp: new Date(),
      message: `Emergency! Rider needs help. Trip ID: ${tripId}`,
    });

    setShowSOS(false);
  };

  // Calculate distance between two points
  function calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3;
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Get trip status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED':
      case 'SEARCHING':
        return 'bg-blue-500/10 text-blue-500';
      case 'DRIVER_FOUND':
      case 'ARRIVED':
        return 'bg-amber-500/10 text-amber-500';
      case 'IN_PROGRESS':
        return 'bg-green-500/10 text-green-500';
      case 'COMPLETED':
        return 'bg-green-600/10 text-green-600';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted/10 text-muted-foreground';
    }
  };

  // Get trip status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REQUESTED':
      case 'SEARCHING':
        return <Search className="h-4 w-4" />;
      case 'DRIVER_FOUND':
      case 'ARRIVED':
        return <AlertTriangle className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <Navigation className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'CANCELLED':
        return <X className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  // Status message
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'Your request has been submitted. Finding available drivers...';
      case 'SEARCHING':
        return 'Searching for nearby drivers...';
      case 'DRIVER_FOUND':
        return 'Driver found! They are on their way to your pickup location.';
      case 'ARRIVED':
        return `${driverInfo?.name || 'Your driver'} has arrived at your pickup location.`;
      case 'IN_PROGRESS':
        return 'Trip in progress. You can track your driver in real-time.';
      case 'COMPLETED':
        return 'Trip completed successfully. Thank you for riding with Trippo.OS!';
      case 'CANCELLED':
        return trip?.cancelReason || 'This trip has been cancelled.';
      default:
        return 'Loading trip information...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Track Your Ride</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time tracking and updates for your trip
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <Alert variant="destructive" className="animate-in slide-in-from-top-2">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Connection Issue</AlertTitle>
          <AlertDescription>
            {connectionError}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConnectionError(null)}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && !trip && (
        <Card className="bg-card border border-border/20">
          <CardContent className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-4">Loading trip information...</p>
          </CardContent>
        </Card>
      )}

      {trip && (
        <>
          {/* Trip Status Card */}
          <Card className="bg-card border border-border/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${getStatusColor(trip.status)}`}>
                    {getStatusIcon(trip.status)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{trip.status.replace('_', ' ')}</h2>
                    <p className="text-sm text-muted-foreground">
                      {getStatusMessage(trip.status)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-sm">
                  {trip.id}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Map */}
            <Card className="bg-card border border-border/20 lg:row-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                  Live Tracking Map
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Real-time driver location and trip route
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <MapContainer
                  center={
                    driverLocation
                      ? [driverLocation.lat, driverLocation.lng]
                      : [trip.pickupLat, trip.pickupLng]
                  }
                  zoom={14}
                  style={{ height: '400px', width: '100%' }}
                  className="rounded-lg"
                >
                  <TileLayer
                    attribution='© OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Pickup Marker */}
                  <CircleMarker
                    center={[trip.pickupLat, trip.pickupLng]}
                    radius={100}
                    fillColor="#22c55e"
                    color="transparent"
                    fillOpacity={0.2}
                  >
                    <Marker
                      position={[trip.pickupLat, trip.pickupLng]}
                      icon={L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background: #22c55e; width: 36px; height: 36px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8s12 8 12 8v0c0-6-8-12-8s12-8 12 8z"/></svg>
                        </div>`,
                        iconSize: [36, 36],
                        iconAnchor: [18, 18],
                      })}
                    >
                      <Popup>
                        <div className="space-y-1 min-w-[200px]">
                          <p className="text-sm font-semibold text-foreground">Pickup</p>
                          <p className="text-xs text-muted-foreground">{trip.pickupAddress}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </CircleMarker>

                  {/* Dropoff Marker */}
                  <CircleMarker
                    center={[trip.dropoffLat, trip.dropoffLng]}
                    radius={100}
                    fillColor="#f59e0b"
                    color="transparent"
                    fillOpacity={0.2}
                  >
                    <Marker
                      position={[trip.dropoffLat, trip.dropoffLng]}
                      icon={L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background: #f59e0b; width: 36px; height: 36px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8s12 8 12 8v0c0-6-8-12-8s12 8 12 8z"/></svg>
                        </div>`,
                        iconSize: [36, 36],
                        iconAnchor: [18, 18],
                      })}
                    >
                      <Popup>
                        <div className="space-y-1 min-w-[200px]">
                          <p className="text-sm font-semibold text-foreground">Dropoff</p>
                          <p className="text-xs text-muted-foreground">{trip.dropoffAddress}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </CircleMarker>

                  {/* Driver Marker */}
                  {driverLocation && tripStatus === 'IN_PROGRESS' && (
                    <Marker
                      position={[driverLocation.lat, driverLocation.lng]}
                      icon={L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background: #f59e0b; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(245, 158, 11, 0.4); display: flex; align-items: center; justify-content: center;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1.1.4 1.5 1 .5.5.9.4 1.4-1.5 1.9V10c0-6-8-12-8s-12 8-12 8v7c0 .6-.4 1.1-1 1.5 1 .5.5.9-.4 1.4-1.5 1.9zM12 17l-6-6-3.5-3.5L2 12h4"/></svg>
                        </div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                      })}
                    >
                      <Popup>
                        <div className="space-y-2 min-w-[200px]">
                          <p className="text-sm font-semibold text-foreground">
                            {driverInfo?.name || 'Your Driver'}
                          </p>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>{driverInfo?.vehicle?.model} {driverInfo?.vehicle?.color}</p>
                            <p>Plate: {driverInfo?.vehicle?.plate}</p>
                            <p>Rating: {driverInfo?.rating} ★</p>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{driverInfo?.phone}</span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Route line */}
                  {driverLocation && tripStatus === 'IN_PROGRESS' && (
                    <Polyline
                      positions={[
                        [driverLocation.lat, driverLocation.lng],
                        [trip.dropoffLat, trip.dropoffLng],
                      ]}
                      color="#f59e0b"
                      weight={4}
                      opacity={0.7}
                    />
                  )}
                </MapContainer>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Driver Info */}
            {driverInfo && (
              <Card className="bg-card border border-border/20">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Your Driver
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <CarIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {driverInfo.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3 text-green-500" />
                        <span>Verified</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vehicle</span>
                      <span className="text-sm text-foreground">
                        {driverInfo.vehicle?.model} - {driverInfo.vehicle?.color}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">License Plate</span>
                      <span className="text-sm font-mono text-foreground">
                        {driverInfo.vehicle?.plate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-foreground">
                          {driverInfo.rating}
                        </span>
                        <span className="text-sm text-primary">★</span>
                      </div>
                    </div>
                    {eta !== null && tripStatus === 'IN_PROGRESS' && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">ETA</span>
                        <span className="text-sm font-semibold text-foreground">
                          {eta} min
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SOS Button */}
            <Card className="bg-card border border-red-500/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-red-500 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Emergency SOS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-red-500/10 border-red-500/20">
                  <Shield className="h-4 w-4 text-red-500" />
                  <AlertTitle className="text-red-500">Your safety is our priority</AlertTitle>
                  <AlertDescription className="text-xs text-red-500/80">
                    Tap SOS if you're in immediate danger. Nearby drivers and our team will be notified instantly.
                  </AlertDescription>
                </Alert>

                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleSOS}
                  disabled={sosSent}
                  className={`w-full h-14 ${sosSent ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {sosSent ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Alert Sent!
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Trigger Emergency SOS
                    </>
                  )}
                </Button>

                {sosSent && (
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-500">Help is on the way!</AlertTitle>
                    <AlertDescription className="text-xs text-green-500/80">
                      Emergency services have been notified. Nearby drivers have been alerted to your location.
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <div className="text-xs text-muted-foreground">
                  <p className="mb-1">Alternative contacts:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>Emergency: 911</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      <span>Tripppo Support: +1-800-TRIPPO</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat/Messages */}
            <Card className="bg-card border border-border/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Driver Chat
                  </CardTitle>
                  <Badge variant={connected ? 'default' : 'secondary'} className="text-xs">
                    {connected ? 'Live' : 'Offline'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 bg-muted/20 rounded-lg">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Send a message to your driver
                        </p>
                      </div>
                    )}

                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex flex-col items-${
                          msg.from === 'RIDER' ? 'end' : 'start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.from === 'RIDER'
                              ? 'bg-primary/10 text-primary-foreground'
                              : 'bg-muted/30 text-foreground'
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                      disabled={!connected}
                      className="flex-1 bg-background"
                    />
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!connected || !message.trim()}
                      className="bg-primary text-primary-foreground"
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>
          </div>

          {/* Last Known Location */}
          {lastLocation && (
            <Card className="bg-card border border-border/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                  Last Known Driver Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-foreground">
                      {lastLocation.lat.toFixed(4)}, {lastLocation.lng.toFixed(4)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(lastLocation.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  <p className="mb-1">Location details:</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Accuracy:</span>
                      <span>~10m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span>{driverLocation?.speed ? `${driverLocation.speed.toFixed(1)} m/s` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heading:</span>
                      <span>{driverLocation?.heading ? `${driverLocation.heading.toFixed(0)}°` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
    )}
    </div>
  );
}
