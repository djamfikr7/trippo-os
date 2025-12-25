'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertTriangle, Flame, TrendingUp } from 'lucide-react';

interface HeatZone {
  id: string;
  lat: number;
  lng: number;
  demand: number;
  surge: number;
  avgWaitTime: number;
  availableDrivers: number;
  region: string;
}

interface ActiveDriver {
  id: string;
  lat: number;
  lng: number;
  name: string;
  rating: number;
  tripsToday: number;
  vehicleType: string;
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
}

export function HeatMapDashboard() {
  const [selectedView, setSelectedView] = useState<'demand' | 'surge' | 'drivers'>('demand');
  const [heatIntensity, setHeatIntensity] = useState([50]);

  // Sample heat zones data
  const heatZones: HeatZone[] = [
    {
      id: 'HZ-001',
      lat: 40.7128,
      lng: -74.0060,
      demand: 95,
      surge: 2.5,
      avgWaitTime: 8,
      availableDrivers: 12,
      region: 'Downtown',
    },
    {
      id: 'HZ-002',
      lat: 40.7589,
      lng: -73.9851,
      demand: 88,
      surge: 2.1,
      avgWaitTime: 6,
      availableDrivers: 18,
      region: 'Midtown',
    },
    {
      id: 'HZ-003',
      lat: 40.7484,
      lng: -73.9857,
      demand: 72,
      surge: 1.8,
      avgWaitTime: 10,
      availableDrivers: 8,
      region: 'Times Square',
    },
    {
      id: 'HZ-004',
      lat: 40.7614,
      lng: -73.9776,
      demand: 65,
      surge: 1.5,
      avgWaitTime: 5,
      availableDrivers: 15,
      region: 'Central Park',
    },
    {
      id: 'HZ-005',
      lat: 40.6892,
      lng: -74.0445,
      demand: 58,
      surge: 1.3,
      avgWaitTime: 7,
      availableDrivers: 10,
      region: 'Brooklyn Heights',
    },
  ];

  // Sample active drivers
  const activeDrivers: ActiveDriver[] = [
    {
      id: 'DRV-001',
      lat: 40.7128,
      lng: -74.0060,
      name: 'Mike Johnson',
      rating: 4.8,
      tripsToday: 24,
      vehicleType: 'STANDARD',
      status: 'ONLINE',
    },
    {
      id: 'DRV-002',
      lat: 40.7589,
      lng: -73.9851,
      name: 'Tom Davis',
      rating: 4.9,
      tripsToday: 31,
      vehicleType: 'PREMIUM',
      status: 'BUSY',
    },
    {
      id: 'DRV-003',
      lat: 40.7484,
      lng: -73.9857,
      name: 'James Wilson',
      rating: 4.7,
      tripsToday: 18,
      vehicleType: 'STANDARD',
      status: 'ONLINE',
    },
    {
      id: 'DRV-004',
      lat: 40.7614,
      lng: -73.9776,
      name: 'Robert Miller',
      rating: 4.6,
      tripsToday: 42,
      vehicleType: 'PREMIUM',
      status: 'BUSY',
    },
    {
      id: 'DRV-005',
      lat: 40.6892,
      lng: -74.0445,
      name: 'Sarah Brown',
      rating: 4.5,
      tripsToday: 15,
      vehicleType: 'STANDARD',
      status: 'ONLINE',
    },
  ];

  const getDemandColor = (demand: number) => {
    if (demand >= 90) return '#ef4444'; // Red - Critical
    if (demand >= 75) return '#f59e0b'; // Amber - High
    if (demand >= 60) return '#eab308'; // Yellow - Medium
    if (demand >= 45) return '#22c55e'; // Green - Normal
    return '#3b82f6'; // Blue - Low
  };

  const getSurgeColor = (surge: number) => {
    if (surge >= 2.5) return '#ef4444';
    if (surge >= 2.0) return '#f97316';
    if (surge >= 1.5) return '#f59e0b';
    return '#22c55e';
  };

  const getDriverColor = (driver: ActiveDriver) => {
    if (driver.status === 'BUSY') return '#f59e0b';
    if (driver.rating >= 4.8) return '#22c55e';
    if (driver.rating >= 4.5) return '#3b82f6';
    return '#6b7280';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <HeatMap className="h-5 w-5 text-primary" />
            Heat Map & Surge Analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time demand visualization and surge pricing zones
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-card border-border/20">
            <Activity className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground">
            <TrendingUp className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <Flame className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Surge Zones</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Surge Multiplier</p>
                <p className="text-2xl font-bold text-foreground">1.8x</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">High Demand Areas</p>
                <p className="text-2xl font-bold text-foreground">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Drivers</p>
                <p className="text-2xl font-bold text-foreground">63</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <Card className="lg:col-span-2 bg-card border border-border/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Demand Heat Map
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Click zones for detailed information
                </CardDescription>
              </div>
              <Tabs defaultValue="demand" className="w-auto">
                <TabsList className="bg-muted/50">
                  <TabsTrigger
                    value="demand"
                    onClick={() => setSelectedView('demand')}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Demand
                  </TabsTrigger>
                  <TabsTrigger
                    value="surge"
                    onClick={() => setSelectedView('surge')}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Surge
                  </TabsTrigger>
                  <TabsTrigger
                    value="drivers"
                    onClick={() => setSelectedView('drivers')}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Drivers
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <MapContainer
              center={[40.7128, -74.0060]}
              zoom={12}
              style={{ height: '500px', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Heat Zones */}
              {selectedView !== 'drivers' && heatZones.map((zone) => (
                <CircleMarker
                  key={zone.id}
                  center={[zone.lat, zone.lng]}
                  radius={selectedView === 'demand' ? zone.demand * 2 : zone.surge * 30}
                  fillColor={
                    selectedView === 'demand'
                      ? getDemandColor(zone.demand)
                      : getSurgeColor(zone.surge)
                  }
                  color="transparent"
                  fillOpacity={0.6}
                  className="animate-pulse"
                >
                  <Popup>
                    <div className="space-y-2 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{zone.region}</span>
                        <Badge variant={zone.surge >= 2 ? 'destructive' : 'default'}>
                          {zone.surge}x
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Demand:</span>
                          <span className="font-semibold">{zone.demand}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Surge:</span>
                          <span className="font-semibold">{zone.surge}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Wait:</span>
                          <span className="font-semibold">{zone.avgWaitTime}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Drivers:</span>
                          <span className="font-semibold">{zone.availableDrivers}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Active Drivers */}
              {selectedView === 'drivers' && activeDrivers.map((driver) => (
                <CircleMarker
                  key={driver.id}
                  center={[driver.lat, driver.lng]}
                  radius={8}
                  fillColor={getDriverColor(driver)}
                  color="#fff"
                  fillOpacity={0.9}
                  weight={2}
                >
                  <Popup>
                    <div className="space-y-2 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            driver.status === 'ONLINE' ? 'bg-green-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="font-semibold">{driver.name}</span>
                      </div>
                      <div className="space-y-1 text-sm">
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
                          <span className="text-muted-foreground">Status:</span>
                          <Badge
                            variant={driver.status === 'ONLINE' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {driver.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Zone List */}
          <Card className="bg-card border border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Demand Zones
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                High-priority areas requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {heatZones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between rounded-lg bg-muted/30 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: getDemandColor(zone.demand) }}
                      />
                      <p className="text-sm font-medium text-foreground">{zone.region}</p>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                      <span>Demand: {zone.demand}%</span>
                      <span className="text-amber-500">{zone.surge}x</span>
                    </div>
                  </div>
                  <Badge variant={zone.surge >= 2 ? 'destructive' : 'outline'} className="text-xs">
                    {zone.availableDrivers} drivers
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="bg-card border border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Visualization Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Heat Intensity
                  </label>
                  <span className="text-sm text-muted-foreground">{heatIntensity}%</span>
                </div>
                <Slider
                  value={heatIntensity}
                  onValueChange={setHeatIntensity}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Color Scheme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'].map((color) => (
                    <button
                      key={color}
                      className="h-8 rounded-md border border-border/20 hover:border-border/40 transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="bg-card border border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm font-semibold text-red-500">Critical Surge</p>
                <p className="text-xs text-red-500/80 mt-1">
                  Downtown area at 2.5x surge - dispatch more drivers
                </p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <p className="text-sm font-semibold text-amber-500">Driver Shortage</p>
                <p className="text-xs text-amber-500/80 mt-1">
                  Times Square has only 8 drivers for 72% demand
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
