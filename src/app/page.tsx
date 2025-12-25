'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import { RatingManagement } from '@/components/dashboard/rating-management';
import DriversPage from '@/components/dashboard/drivers-page';
import TripsPage from '@/components/dashboard/trips-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Truck,
  Star,
  Shield,
  BarChart3,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic imports to prevent SSR issues with Leaflet
const DynamicHeatMap = dynamic(
  () => import('@/components/dashboard/heatmap-dashboard').then(mod => ({ default: mod.HeatMapDashboard })),
  { ssr: false, loading: () => <div className="h-[500px] flex items-center justify-center">Loading map...</div> }
);

const DynamicRealTimeTracking = dynamic(
  () => import('@/components/dashboard/realtime-tracking').then(mod => ({ default: mod.RealTimeTracking })),
  { ssr: false, loading: () => <div className="h-[600px] flex items-center justify-center">Loading tracking...</div> }
);

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trippo.OS Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive logistics platform management with real-time analytics
          </p>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-muted/50">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="drivers"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Truck className="mr-2 h-4 w-4" />
              Drivers
            </TabsTrigger>
            <TabsTrigger
              value="trips"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Trips
            </TabsTrigger>
            <TabsTrigger
              value="tracking"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Shield className="mr-2 h-4 w-4" />
              Tracking
            </TabsTrigger>
            <TabsTrigger
              value="heatmap"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Shield className="mr-2 h-4 w-4" />
              Heat Map
            </TabsTrigger>
            <TabsTrigger
              value="ratings"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Star className="mr-2 h-4 w-4" />
              Ratings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                  title="Total Rides"
                  value="2,847"
                  change="+12.5%"
                  changeType="increase"
                  icon={MapPin}
                  description="Last 7 days"
                />
                <StatCard
                  title="Active Drivers"
                  value="156"
                  change="+8.2%"
                  changeType="increase"
                  icon={Truck}
                  description="Currently online"
                />
                <StatCard
                  title="Total Revenue"
                  value="$45,234"
                  change="+15.3%"
                  changeType="increase"
                  icon={BarChart3}
                  description="Cash collected"
                />
                <StatCard
                  title="Registered Users"
                  value="8,421"
                  change="+22.1%"
                  changeType="increase"
                  icon={Users}
                  description="Active riders"
                />
              </div>

              {/* Features Preview */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-card border border-border/20 p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Real-Time Heat Map</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View demand zones, surge pricing, and driver distribution across the city
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <MapPin className="h-4 w-4" />
                    <span>Go to Heat Map tab</span>
                  </div>
                </div>
                <div className="rounded-lg bg-card border border-border/20 p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Fraud Detection</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Automated detection of payment avoidance, fake locations, and route manipulation
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Shield className="h-4 w-4" />
                    <span>Go to Ratings tab</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="mt-6">
            <div className="space-y-6">
              <DriversPage />
            </div>
          </TabsContent>

          <TabsContent value="trips" className="mt-6">
            <div className="space-y-6">
              <TripsPage />
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="mt-6">
            <DynamicRealTimeTracking />
          </TabsContent>

          <TabsContent value="heatmap" className="mt-6">
            <DynamicHeatMap />
          </TabsContent>

          <TabsContent value="ratings" className="mt-6">
            <div className="space-y-6">
              <RatingManagement />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
