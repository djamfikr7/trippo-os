'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  DollarSign,
  Wallet,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Search,
  Filter,
  Download,
  Calendar,
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

export default function TransactionsPage() {
  // Sample transaction data
  const transactions = [
    {
      id: 'TXN-001',
      tripId: 'TRP-001',
      amount: 24.50,
      type: 'CASH_PAYMENT',
      status: 'COLLECTED',
      collectedAt: '2024-01-21T10:58:00',
      driver: 'Mike Johnson',
      driverPlate: 'ABC-1234',
      rider: 'John Smith',
    },
    {
      id: 'TXN-002',
      tripId: 'TRP-002',
      amount: 18.75,
      type: 'CASH_PAYMENT',
      status: 'PENDING',
      collectedAt: null,
      driver: 'Tom Davis',
      driverPlate: 'XYZ-5678',
      rider: 'Sarah Williams',
    },
    {
      id: 'TXN-003',
      tripId: 'TRP-003',
      amount: 32.00,
      type: 'CASH_PAYMENT',
      status: 'COLLECTED',
      collectedAt: '2024-01-21T10:05:00',
      driver: 'James Wilson',
      driverPlate: 'DEF-9012',
      rider: 'David Brown',
    },
    {
      id: 'TXN-004',
      tripId: 'TRP-006',
      amount: 45.75,
      type: 'CASH_PAYMENT',
      status: 'DISPUTED',
      collectedAt: '2024-01-21T09:30:00',
      driver: 'Robert Miller',
      driverPlate: 'GHI-3456',
      rider: 'Emily Davis',
      disputeReason: 'Fare discrepancy reported',
    },
    {
      id: 'TXN-005',
      tripId: 'TRP-007',
      amount: 19.50,
      type: 'CASH_PAYMENT',
      status: 'COLLECTED',
      collectedAt: '2024-01-21T09:15:00',
      driver: 'William Brown',
      driverPlate: 'JKL-7890',
      rider: 'Michael Johnson',
    },
    {
      id: 'TXN-006',
      tripId: 'TRP-008',
      amount: 28.90,
      type: 'COMMISSION',
      status: 'COLLECTED',
      collectedAt: '2024-01-21T08:55:00',
      driver: 'Sarah Brown',
      driverPlate: 'MNO-1234',
      rider: 'Lisa Anderson',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COLLECTED':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'DISPUTED':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default:
        return '';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
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
            <h1 className="text-2xl font-bold text-foreground">Cash Collection</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track cash payments and collections
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-card border-border/20">
              <Calendar className="mr-2 h-4 w-4" />
              Daily Report
            </Button>
            <Button variant="outline" className="bg-card border-border/20">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Collected"
            value="$45,234"
            change="+15.3%"
            changeType="increase"
            icon={CheckCircle}
            description="Today's collections"
          />
          <StatCard
            title="Pending Collection"
            value="$2,847"
            change="-8.2%"
            changeType="increase"
            icon={Wallet}
            description="Outstanding payments"
          />
          <StatCard
            title="Disputed Amount"
            value="$45.75"
            change="+2"
            changeType="decrease"
            icon={AlertCircle}
            description="Under review"
          />
          <StatCard
            title="Collection Rate"
            value="94.2%"
            change="+2.1%"
            changeType="increase"
            icon={TrendingUp}
            description="Success rate"
          />
        </div>

        {/* Cash Collection Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card border border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Collection Summary
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Today's cash collection breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Collected</p>
                    <p className="text-xs text-muted-foreground">Successfully received</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-green-500">$45,234</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                    <Wallet className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Pending</p>
                    <p className="text-xs text-muted-foreground">Awaiting collection</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-yellow-500">$2,847</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Disputed</p>
                    <p className="text-xs text-muted-foreground">Under review</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-red-500">$45.75</p>
              </div>

              <div className="mt-4 pt-4 border-t border-border/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Total Expected</p>
                  <p className="text-lg font-bold text-primary">$48,126.75</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Top Collectors
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Drivers with most cash collections today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Mike Johnson', plate: 'ABC-1234', amount: 847, trips: 12 },
                { name: 'Tom Davis', plate: 'XYZ-5678', amount: 723, trips: 15 },
                { name: 'James Wilson', plate: 'DEF-9012', amount: 689, trips: 11 },
                { name: 'Robert Miller', plate: 'GHI-3456', amount: 654, trips: 13 },
                { name: 'William Brown', plate: 'JKL-7890', amount: 598, trips: 10 },
              ].map((driver, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{driver.name}</p>
                      <p className="text-xs text-muted-foreground">{driver.plate} · {driver.trips} trips</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary">${driver.amount}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by transaction ID, driver, or rider..."
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
                    <SelectItem value="collected">Collected</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cash">Cash Payment</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
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

        {/* Transactions Table */}
        <Card className="bg-card border border-border/20">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              All Transactions
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              View and manage cash transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/20">
                  <TableHead className="text-muted-foreground">Transaction</TableHead>
                  <TableHead className="text-muted-foreground">Trip</TableHead>
                  <TableHead className="text-muted-foreground">Driver</TableHead>
                  <TableHead className="text-muted-foreground">Rider</TableHead>
                  <TableHead className="text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Collected At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id} className="border-border/10 hover:bg-muted/50">
                    <TableCell className="font-mono text-xs text-primary">{txn.id}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{txn.tripId}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{txn.driver}</p>
                        <p className="text-xs text-muted-foreground">{txn.driverPlate}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{txn.rider}</TableCell>
                    <TableCell className="text-sm font-semibold">${txn.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {txn.type === 'CASH_PAYMENT' ? 'CASH' : 'COMMISSION'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(txn.status)}>
                        {txn.status}
                      </Badge>
                      {txn.status === 'DISPUTED' && (
                        <p className="text-xs text-red-500 mt-1">{txn.disputeReason}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(txn.collectedAt)}
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
