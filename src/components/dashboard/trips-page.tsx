'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Car,
  Search,
  Filter,
  Download,
  MoreVertical,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TripsPage() {
  // Sample trip data
  const trips = [
    {
      id: 'TRP-001',
      rider: 'John Smith',
      riderPhone: '+1 (555) 123-4567',
      driver: 'Mike Johnson',
      driverPlate: 'ABC-1234',
      status: 'COMPLETED',
      pickupAddress: '123 Main St, Downtown',
      dropoffAddress: 'Airport Terminal 1',
      distanceMeters: 15234,
      durationSeconds: 1234,
      fare: 24.50,
      paymentMethod: 'CASH',
      isPaid: true,
      createdAt: '2024-01-21T10:30:00',
      startedAt: '2024-01-21T10:35:00',
      completedAt: '2024-01-21T10:55:00',
    },
    {
      id: 'TRP-002',
      rider: 'Sarah Williams',
      riderPhone: '+1 (555) 234-5678',
      driver: 'Tom Davis',
      driverPlate: 'XYZ-5678',
      status: 'IN_PROGRESS',
      pickupAddress: 'Central Station',
      dropoffAddress: 'Westfield Mall',
      distanceMeters: 8945,
      durationSeconds: 890,
      fare: 18.75,
      paymentMethod: 'CASH',
      isPaid: false,
      createdAt: '2024-01-21T11:15:00',
      startedAt: '2024-01-21T11:20:00',
      completedAt: null,
    },
    {
      id: 'TRP-003',
      rider: 'David Brown',
      riderPhone: '+1 (555) 345-6789',
      driver: 'James Wilson',
      driverPlate: 'DEF-9012',
      status: 'COMPLETED',
      pickupAddress: 'Grand Hotel',
      dropoffAddress: 'Business District Tower',
      distanceMeters: 7890,
      durationSeconds: 720,
      fare: 32.00,
      paymentMethod: 'CASH',
      isPaid: true,
      createdAt: '2024-01-21T09:45:00',
      startedAt: '2024-01-21T09:50:00',
      completedAt: '2024-01-21T10:02:00',
    },
    {
      id: 'TRP-004',
      rider: 'Emily Davis',
      riderPhone: '+1 (555) 456-7890',
      driver: 'Robert Miller',
      driverPlate: 'GHI-3456',
      status: 'DRIVER_FOUND',
      pickupAddress: 'University Campus, Gate A',
      dropoffAddress: 'Central Park North',
      distanceMeters: 4567,
      durationSeconds: 540,
      fare: 15.25,
      paymentMethod: 'CASH',
      isPaid: false,
      createdAt: '2024-01-21T11:30:00',
      startedAt: null,
      completedAt: null,
    },
    {
      id: 'TRP-005',
      rider: 'Michael Johnson',
      riderPhone: '+1 (555) 567-8901',
      driver: 'William Brown',
      driverPlate: 'JKL-7890',
      status: 'CANCELLED',
      pickupAddress: 'Shopping Center',
      dropoffAddress: 'Residential Area',
      distanceMeters: 3456,
      durationSeconds: 420,
      fare: 28.90,
      paymentMethod: 'CASH',
      isPaid: false,
      createdAt: '2024-01-21T10:00:00',
      startedAt: null,
      completedAt: null,
      cancelReason: 'Driver cancelled - Vehicle issue',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'IN_PROGRESS':
        return 'bg-primary/10 text-primary hover:bg-primary/20';
      case 'DRIVER_FOUND':
      case 'ARRIVED':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'SEARCHING':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      default:
        return '';
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trip Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and manage all platform trips
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-card border-border/20">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Trips Today"
            value="1,247"
            change="+18.5%"
            changeType="increase"
            icon={MapPin}
            description="All trips"
          />
          <StatCard
            title="Active Rides"
            value="89"
            change="+7"
            changeType="increase"
            icon={Car}
            description="Currently in progress"
          />
          <StatCard
            title="Revenue Today"
            value="$12,847"
            change="+22.3%"
            changeType="increase"
            icon={DollarSign}
            description="Cash collected"
          />
          <StatCard
            title="Avg Wait Time"
            value="3.2m"
            change="-0.5m"
            changeType="increase"
            icon={Clock}
            description="Rider pickup"
          />
        </div>

        {/* Filters */}
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by trip ID, rider, or driver..."
                    className="pl-9 bg-background"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px] bg-background">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  className="w-[160px] bg-background"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trips Table */}
        <Card className="bg-card border border-border/20">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              All Trips
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              View and manage trip history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/20">
                  <TableHead className="text-muted-foreground">Trip ID</TableHead>
                  <TableHead className="text-muted-foreground">Rider</TableHead>
                  <TableHead className="text-muted-foreground">Driver</TableHead>
                  <TableHead className="text-muted-foreground">Route</TableHead>
                  <TableHead className="text-muted-foreground">Distance</TableHead>
                  <TableHead className="text-muted-foreground">Fare</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Payment</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.id} className="border-border/10 hover:bg-muted/50">
                    <TableCell className="font-mono text-xs text-primary">{trip.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{trip.rider}</p>
                        <p className="text-xs text-muted-foreground">{trip.riderPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trip.driver ? (
                        <div>
                          <p className="text-sm text-foreground">{trip.driver}</p>
                          <p className="text-xs text-muted-foreground">{trip.driverPlate}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Searching...</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-muted-foreground">{trip.pickupAddress}</p>
                        <p className="text-xs text-muted-foreground">↓</p>
                        <p className="text-sm text-muted-foreground">{trip.dropoffAddress}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDistance(trip.distanceMeters)}</TableCell>
                    <TableCell className="text-sm font-semibold">${trip.fare.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(trip.status)}>
                        {trip.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={trip.isPaid ? 'default' : 'outline'}
                          className={
                            trip.isPaid
                              ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                              : ''
                          }
                        >
                          {trip.isPaid ? 'PAID' : 'UNPAID'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {trip.paymentMethod}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(trip.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>View on Map</DropdownMenuItem>
                          {trip.status === 'COMPLETED' && !trip.isPaid && (
                            <DropdownMenuItem className="text-amber-500">
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                          {trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
                            <DropdownMenuItem className="text-red-500">
                              Cancel Trip
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
