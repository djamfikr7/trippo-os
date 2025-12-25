'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Car,
  User,
  Phone,
  RefreshCw,
  Maximize2,
  Filter,
  Clock,
  Route,
  Navigation,
} from 'lucide-react';
import L from 'leaflet';

// Custom marker icons
const createDriverIcon = (status: 'ONLINE' | 'BUSY' | 'OFFLINE', rating: number) => {
  const color = status === 'BUSY' ? '#f59e0b' : rating >= 4.8 ? '#22c55e' : '#3b82f6';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    ">🚗</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createRiderIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: #8b5cf6;
      width: 35px;
      height: 35px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    ">👤</div>`,
    iconSize: [35, 35],
    iconAnchor: [17, 17],
  });
};

interface Driver {
  id: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  rating: number;
  tripsToday: number;
  vehicleType: string;
  plate: string;
  currentTripId?: string;
}

interface Rider {
  id: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  status: 'WAITING' | 'IN_RIDE' | 'COMPLETED';
  tripId?: string;
  pickupAddress: string;
  dropoffAddress: string;
}

interface ActiveTrip {
  id: string;
  driverId: string;
  driverName: string;
  riderId: string;
  riderName: string;
  status: 'SEARCHING' | 'DRIVER_FOUND' | 'IN_PROGRESS' | 'ARRIVED';
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  route?: Array<[number, number]>;
  eta?: number;
}

export function RealTimeTracking() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'drivers' | 'riders' | 'trips'>('all');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

  // Sample data
  const drivers: Driver[] = [
    {
      id: 'DRV-001',
      name: 'Mike Johnson',
      phone: '+1 (555) 123-4567',
      lat: 40.7128,
      lng: -74.0060,
      status: 'BUSY',
      rating: 4.8,
      tripsToday: 24,
      vehicleType: 'STANDARD',
      plate: 'ABC-1234',
      currentTripId: 'TRP-001',
    },
    {
      id: 'DRV-002',
      name: 'Tom Davis',
      phone: '+1 (555) 234-5678',
      lat: 40.7589,
      lng: -73.9851,
      status: 'ONLINE',
      rating: 4.9,
      tripsToday: 31,
      vehicleType: 'PREMIUM',
      plate: 'XYZ-5678',
    },
    {
      id: 'DRV-003',
      name: 'James Wilson',
      phone: '+1 (555) 345-6789',
      lat: 40.7484,
      lng: -73.9857,
      status: 'BUSY',
      rating: 4.7,
      tripsToday: 18,
      vehicleType: 'STANDARD',
      plate: 'DEF-9012',
      currentTripId: 'TRP-002',
    },
    {
      id: 'DRV-004',
      name: 'Robert Miller',
      phone: '+1 (555) 456-7890',
      lat: 40.7614,
      lng: -73.9776,
      status: 'ONLINE',
      rating: 4.6,
      tripsToday: 42,
      vehicleType: 'PREMIUM',
      plate: 'GHI-3456',
    },
  ];

  const riders: Rider[] = [
    {
      id: 'RDR-001',
      name: 'John Smith',
      phone: '+1 (555) 111-2222',
      lat: 40.7150,
      lng: -74.0080,
      status: 'IN_RIDE',
      tripId: 'TRP-001',
      pickupAddress: '123 Main St',
      dropoffAddress: '456 Park Ave',
    },
    {
      id: 'RDR-002',
      name: 'Sarah Williams',
      phone: '+1 (555) 333-4444',
      lat: 40.7600,
      lng: -73.9870,
      status: 'WAITING',
      tripId: 'TRP-002',
      pickupAddress: '789 Broadway',
      dropoffAddress: '321 Fifth Ave',
    },
  ];

  const activeTrips: ActiveTrip[] = [
    {
      id: 'TRP-001',
      driverId: 'DRV-001',
      driverName: 'Mike Johnson',
      riderId: 'RDR-001',
      riderName: 'John Smith',
      status: 'IN_PROGRESS',
      pickupLat: 40.7150,
      pickupLng: -74.0080,
      dropoffLat: 40.7200,
      dropoffLng: -74.0020,
      route: [
        [40.7150, -74.0080],
        [40.7160, -74.0070],
        [40.7175, -74.0055],
        [40.7190, -74.0040],
        [40.7200, -74.0020],
      ],
      eta: 8,
    },
    {
      id: 'TRP-002',
      driverId: 'DRV-003',
      driverName: 'James Wilson',
      riderId: 'RDR-002',
      riderName: 'Sarah Williams',
      status: 'DRIVER_FOUND',
      pickupLat: 40.7600,
      pickupLng: -73.9870,
      dropoffLat: 40.7650,
      dropoffLng: -73.9820,
      route: [
        [40.7600, -73.9870],
        [40.7615, -73.9860],
        [40.7630, -73.9840],
        [40.7650, -73.9820],
      ],
      eta: 5,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Real-Time Tracking
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Live monitoring of all drivers, riders, and active trips
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px] bg-card">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online Only</SelectItem>
              <SelectItem value="busy">In Trip</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="bg-card border-border/20">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground">
            <Maximize2 className="mr-2 h-4 w-4" />
            Full Screen
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Car className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Drivers</p>
                <p className="text-2xl font-bold text-foreground">{drivers.filter(d => d.status !== 'OFFLINE').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <User className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Riders</p>
                <p className="text-2xl font-bold text-foreground">{riders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Route className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Trips</p>
                <p className="text-2xl font-bold text-foreground">{activeTrips.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg ETA</p>
                <p className="text-2xl font-bold text-foreground">6.5m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Map */}
        <Card className="lg:col-span-3 bg-card border border-border/20">
          <CardHeader>
            <Tabs defaultValue="all" className="w-auto">
              <TabsList className="bg-muted/50">
                <TabsTrigger
                  value="all"
                  onClick={() => setSelectedTab('all')}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="drivers"
                  onClick={() => setSelectedTab('drivers')}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Drivers
                </TabsTrigger>
                <TabsTrigger
                  value="riders"
                  onClick={() => setSelectedTab('riders')}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Riders
                </TabsTrigger>
                <TabsTrigger
                  value="trips"
                  onClick={() => setSelectedTab('trips')}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Trips
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <MapContainer
              center={[40.7350, -73.9900]}
              zoom={13}
              style={{ height: '600px', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Driver Markers */}
              {(selectedTab === 'all' || selectedTab === 'drivers') && drivers.map((driver) => (
                <Marker
                  key={driver.id}
                  position={[driver.lat, driver.lng]}
                  icon={createDriverIcon(driver.status, driver.rating)}
                >
                  <Popup>
                    <div className="space-y-2 min-w-[250px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{driver.name}</span>
                        <Badge
                          variant={driver.status === 'ONLINE' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {driver.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {driver.phone}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rating:</span>
                          <span className="font-semibold">{driver.rating} ★</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Trips Today:</span>
                          <span className="font-semibold">{driver.tripsToday}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vehicle:</span>
                          <span className="font-semibold">{driver.vehicleType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plate:</span>
                          <span className="font-mono text-xs">{driver.plate}</span>
                        </div>
                      </div>
                      <Button className="w-full mt-2" size="sm">
                        <Navigation className="mr-2 h-4 w-4" />
                        Route to Driver
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Rider Markers */}
              {(selectedTab === 'all' || selectedTab === 'riders') && riders.map((rider) => (
                <Marker
                  key={rider.id}
                  position={[rider.lat, rider.lng]}
                  icon={createRiderIcon()}
                >
                  <Popup>
                    <div className="space-y-2 min-w-[250px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{rider.name}</span>
                        <Badge
                          variant={rider.status === 'IN_RIDE' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {rider.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {rider.phone}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            📍 Pickup: {rider.pickupAddress}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            🎯 Dropoff: {rider.dropoffAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Trip Routes */}
              {(selectedTab === 'all' || selectedTab === 'trips') && activeTrips.map((trip) => (
                <>
                  {trip.route && (
                    <Polyline
                      positions={trip.route}
                      color="#f59e0b"
                      weight={4}
                      opacity={0.7}
                    />
                  )}
                  <Circle
                    center={[trip.pickupLat, trip.pickupLng]}
                    radius={100}
                    color="#22c55e"
                    fillOpacity={0.2}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-semibold">Pickup Point</p>
                        <p className="text-xs text-muted-foreground">{trip.riderName}</p>
                      </div>
                    </Popup>
                  </Circle>
                  <Circle
                    center={[trip.dropoffLat, trip.dropoffLng]}
                    radius={100}
                    color="#ef4444"
                    fillOpacity={0.2}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-semibold">Dropoff Point</p>
                        <p className="text-xs text-muted-foreground">{trip.riderName}</p>
                        <p className="text-xs text-primary font-semibold">ETA: {trip.eta} min</p>
                      </div>
                    </Popup>
                  </Circle>
                </>
              ))}
            </MapContainer>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Active Trips List */}
          <Card className="bg-card border border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Active Trips
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Currently in progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-lg bg-muted/30 p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-primary">{trip.id}</span>
                    <Badge
                      variant={trip.status === 'IN_PROGRESS' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {trip.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-xs text-muted-foreground">
                      👤 {trip.riderName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      🚗 {trip.driverName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <Clock className="h-3 w-3" />
                      ETA: {trip.eta} min
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Online Drivers */}
          <Card className="bg-card border border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Online Drivers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {drivers.filter(d => d.status !== 'OFFLINE').map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 rounded-lg bg-muted/30 p-2 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold">
                    {driver.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{driver.name}</p>
                    <p className="text-xs text-muted-foreground">{driver.tripsToday} trips</p>
                  </div>
                  <Badge
                    variant={driver.status === 'ONLINE' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {driver.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
