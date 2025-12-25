'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  MapPin,
  Star,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function DriversPage() {
  // Sample driver data
  const drivers = [
    {
      id: 'DRV-001',
      name: 'Mike Johnson',
      email: 'mike.j@email.com',
      phone: '+1 (555) 123-4567',
      vehicle: 'Toyota Camry',
      plate: 'ABC-1234',
      vehicleType: 'STANDARD',
      isOnline: true,
      isVerified: true,
      rating: 4.8,
      totalTrips: 1247,
      currentLocation: 'Downtown',
      status: 'ONLINE',
    },
    {
      id: 'DRV-002',
      name: 'Tom Davis',
      email: 'tom.d@email.com',
      phone: '+1 (555) 234-5678',
      vehicle: 'Honda Civic',
      plate: 'XYZ-5678',
      vehicleType: 'STANDARD',
      isOnline: true,
      isVerified: true,
      rating: 4.9,
      totalTrips: 2156,
      currentLocation: 'Central Station',
      status: 'ONLINE',
    },
    {
      id: 'DRV-003',
      name: 'James Wilson',
      email: 'james.w@email.com',
      phone: '+1 (555) 345-6789',
      vehicle: 'Ford Explorer',
      plate: 'DEF-9012',
      vehicleType: 'PREMIUM',
      isOnline: true,
      isVerified: true,
      rating: 4.7,
      totalTrips: 892,
      currentLocation: 'Airport',
      status: 'ONLINE',
    },
    {
      id: 'DRV-004',
      name: 'Robert Miller',
      email: 'robert.m@email.com',
      phone: '+1 (555) 456-7890',
      vehicle: 'Chevrolet Malibu',
      plate: 'GHI-3456',
      vehicleType: 'STANDARD',
      isOnline: false,
      isVerified: true,
      rating: 4.6,
      totalTrips: 3241,
      currentLocation: 'Offline',
      status: 'OFFLINE',
    },
    {
      id: 'DRV-005',
      name: 'Sarah Brown',
      email: 'sarah.b@email.com',
      phone: '+1 (555) 567-8901',
      vehicle: 'Nissan Altima',
      plate: 'JKL-7890',
      vehicleType: 'STANDARD',
      isOnline: true,
      isVerified: false,
      rating: 4.5,
      totalTrips: 156,
      currentLocation: 'Shopping Mall',
      status: 'ONLINE',
    },
    {
      id: 'DRV-006',
      name: 'William Taylor',
      email: 'william.t@email.com',
      phone: '+1 (555) 678-9012',
      vehicle: 'Hyundai Sonata',
      plate: 'MNO-1234',
      vehicleType: 'STANDARD',
      isOnline: false,
      isVerified: true,
      rating: 4.4,
      totalTrips: 789,
      currentLocation: 'Offline',
      status: 'OFFLINE',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Driver Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and manage all platform drivers
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Truck className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Drivers"
            value="156"
            change="+12"
            changeType="increase"
            icon={Truck}
            description="Active fleet"
          />
          <StatCard
            title="Online Now"
            value="89"
            change="+5"
            changeType="increase"
            icon={CheckCircle}
            description="Accepting rides"
          />
          <StatCard
            title="Pending Verification"
            value="12"
            change="-3"
            changeType="decrease"
            icon={Clock}
            description="Awaiting approval"
          />
          <StatCard
            title="Avg Rating"
            value="4.7"
            change="+0.1"
            changeType="increase"
            icon={Star}
            description="Fleet average"
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
                    placeholder="Search by name, email, or license plate..."
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
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Vehicle Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="freight">Freight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drivers Table */}
        <Card className="bg-card border border-border/20">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              All Drivers
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              View and manage driver profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/20">
                  <TableHead className="text-muted-foreground">Driver</TableHead>
                  <TableHead className="text-muted-foreground">Vehicle</TableHead>
                  <TableHead className="text-muted-foreground">Plate</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Rating</TableHead>
                  <TableHead className="text-muted-foreground">Trips</TableHead>
                  <TableHead className="text-muted-foreground">Location</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id} className="border-border/10 hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 bg-primary/10">
                          <AvatarFallback className="text-primary text-xs font-semibold">
                            {driver.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">{driver.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{driver.vehicle}</TableCell>
                    <TableCell className="font-mono text-xs">{driver.plate}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          driver.vehicleType === 'PREMIUM' ? 'bg-amber-500/10 text-amber-500' :
                          driver.vehicleType === 'FREIGHT' ? 'bg-blue-500/10 text-blue-500' :
                          ''
                        }
                      >
                        {driver.vehicleType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            driver.isOnline
                              ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {driver.status}
                        </Badge>
                        {!driver.isVerified && (
                          <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 text-xs">
                            UNVERIFIED
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 text-primary fill-primary" />
                        {driver.rating}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{driver.totalTrips.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {driver.currentLocation}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>View Trips</DropdownMenuItem>
                          {!driver.isVerified && (
                            <DropdownMenuItem className="text-green-500">
                              Verify Driver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500">
                            Suspend Driver
                          </DropdownMenuItem>
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
