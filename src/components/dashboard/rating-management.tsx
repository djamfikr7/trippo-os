'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Star,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Shield,
  Ban,
  MoreVertical,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RatingIssue {
  id: string;
  userId: string;
  userName: string;
  type: 'DRIVER' | 'RIDER';
  rating: number;
  issueType: 'LOW_RATING' | 'CANCELLATIONS' | 'FRAUD' | 'SAFETY' | 'DISPUTE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incidents: number;
  description: string;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED';
  date: string;
}

interface RatingHistory {
  id: string;
  userId: string;
  userName: string;
  userRole: 'DRIVER' | 'RIDER';
  rating: number;
  previousRating: number;
  change: number;
  reason: string;
  action: 'DOWNGRADE' | 'UPGRADE' | 'NO_CHANGE';
  actionedBy: string;
  date: string;
}

export function RatingManagement() {
  const [selectedTab, setSelectedTab] = useState<'issues' | 'history' | 'blacklist'>('issues');
  const [selectedIssue, setSelectedIssue] = useState<RatingIssue | null>(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'DOWNGRADE' | 'BLACKLIST' | 'SUSPEND' | 'WARNING'>('WARNING');
  const [actionNote, setActionNote] = useState('');

  // Sample data - issues flagged for review
  const ratingIssues: RatingIssue[] = [
    {
      id: 'ISS-001',
      userId: 'DRV-001',
      userName: 'Mike Johnson',
      type: 'DRIVER',
      rating: 3.2,
      issueType: 'LOW_RATING',
      severity: 'HIGH',
      incidents: 12,
      description: 'Multiple low ratings from riders - complaints about rude behavior',
      status: 'PENDING',
      date: '2024-01-21',
    },
    {
      id: 'ISS-002',
      userId: 'RDR-005',
      userName: 'Emily Davis',
      type: 'RIDER',
      rating: 2.8,
      issueType: 'CANCELLATIONS',
      severity: 'CRITICAL',
      incidents: 28,
      description: 'High cancellation rate - possible fraud attempt to avoid payment',
      status: 'PENDING',
      date: '2024-01-21',
    },
    {
      id: 'ISS-003',
      userId: 'DRV-003',
      userName: 'James Wilson',
      type: 'DRIVER',
      rating: 3.5,
      issueType: 'FRAUD',
      severity: 'CRITICAL',
      incidents: 5,
      description: 'Multiple fraud reports - overcharging and fake routes',
      status: 'REVIEWING',
      date: '2024-01-20',
    },
    {
      id: 'ISS-004',
      userId: 'DRV-007',
      userName: 'Sarah Brown',
      type: 'DRIVER',
      rating: 3.8,
      issueType: 'SAFETY',
      severity: 'MEDIUM',
      incidents: 3,
      description: 'Safety concerns reported - speeding violations',
      status: 'PENDING',
      date: '2024-01-21',
    },
    {
      id: 'ISS-005',
      userId: 'RDR-012',
      userName: 'Robert Miller',
      type: 'RIDER',
      rating: 2.5,
      issueType: 'DISPUTE',
      severity: 'HIGH',
      incidents: 8,
      description: 'Frequent disputes with drivers - payment issues',
      status: 'PENDING',
      date: '2024-01-20',
    },
  ];

  // Sample rating history
  const ratingHistory: RatingHistory[] = [
    {
      id: 'HIST-001',
      userId: 'DRV-001',
      userName: 'Mike Johnson',
      userRole: 'DRIVER',
      rating: 3.2,
      previousRating: 4.5,
      change: -1.3,
      reason: 'Multiple complaints about service quality',
      action: 'DOWNGRADE',
      actionedBy: 'Admin',
      date: '2024-01-21',
    },
    {
      id: 'HIST-002',
      userId: 'DRV-004',
      userName: 'Robert Miller',
      userRole: 'DRIVER',
      rating: 4.9,
      previousRating: 4.7,
      change: 0.2,
      reason: 'Excellent service record restored',
      action: 'UPGRADE',
      actionedBy: 'System',
      date: '2024-01-20',
    },
    {
      id: 'HIST-003',
      userId: 'RDR-005',
      userName: 'Emily Davis',
      userRole: 'RIDER',
      rating: 2.8,
      previousRating: 3.5,
      change: -0.7,
      reason: 'High cancellation rate flagged',
      action: 'DOWNGRADE',
      actionedBy: 'Admin',
      date: '2024-01-21',
    },
    {
      id: 'HIST-004',
      userId: 'DRV-007',
      userName: 'Sarah Brown',
      userRole: 'DRIVER',
      rating: 3.8,
      previousRating: 3.8,
      change: 0,
      reason: 'No significant change required',
      action: 'NO_CHANGE',
      actionedBy: 'Admin',
      date: '2024-01-19',
    },
  ];

  // Blacklisted users
  const blacklistedUsers = [
    {
      id: 'BLK-001',
      userId: 'USR-045',
      userName: 'John Doe',
      type: 'RIDER',
      reason: 'Fraud - fake payment methods',
      blacklistDate: '2024-01-15',
      status: 'PERMANENT',
      reportedBy: 'Admin',
    },
    {
      id: 'BLK-002',
      userId: 'USR-089',
      userName: 'Jane Smith',
      type: 'DRIVER',
      reason: 'Safety violation - aggressive behavior',
      blacklistDate: '2024-01-10',
      status: 'TEMPORARY',
      expiryDate: '2024-07-10',
      reportedBy: 'Admin',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return '';
    }
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'LOW_RATING':
        return <Star className="h-4 w-4" />;
      case 'CANCELLATIONS':
        return <XCircle className="h-4 w-4" />;
      case 'FRAUD':
        return <AlertTriangle className="h-4 w-4" />;
      case 'SAFETY':
        return <Shield className="h-4 w-4" />;
      case 'DISPUTE':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleTakeAction = (issue: RatingIssue) => {
    setSelectedIssue(issue);
    setActionDialog(true);
  };

  const handleActionSubmit = () => {
    // In real app, this would call the API
    console.log(`Action: ${actionType} for user ${selectedIssue?.userId}`, actionNote);
    setActionDialog(false);
    setActionNote('');
    setSelectedIssue(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Rating Management System
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor, evaluate, and manage user ratings with automatic fraud detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-card border-border/20">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground">
            <Shield className="mr-2 h-4 w-4" />
            Run Fraud Check
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold text-foreground">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <TrendingDown className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Downgrades</p>
                <p className="text-2xl font-bold text-foreground">15</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Ban className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Blacklisted</p>
                <p className="text-2xl font-bold text-foreground">23</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-foreground">4.6</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="bg-card border border-border/20">
        <CardHeader>
          <Tabs defaultValue="issues" className="w-full">
            <TabsList className="bg-muted/50 w-full">
              <TabsTrigger
                value="issues"
                onClick={() => setSelectedTab('issues')}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Flagged Issues
              </TabsTrigger>
              <TabsTrigger
                value="history"
                onClick={() => setSelectedTab('history')}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <History className="mr-2 h-4 w-4" />
                Rating History
              </TabsTrigger>
              <TabsTrigger
                value="blacklist"
                onClick={() => setSelectedTab('blacklist')}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Ban className="mr-2 h-4 w-4" />
                Blacklist
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {selectedTab === 'issues' && (
            <Table>
              <TableHeader>
                <TableRow className="border-border/20">
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Rating</TableHead>
                  <TableHead className="text-muted-foreground">Issue</TableHead>
                  <TableHead className="text-muted-foreground">Incidents</TableHead>
                  <TableHead className="text-muted-foreground">Severity</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratingIssues.map((issue) => (
                  <TableRow key={issue.id} className="border-border/10 hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-primary/10">
                          <AvatarFallback className="text-primary text-xs font-semibold">
                            {issue.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{issue.userName}</p>
                          <p className="text-xs text-muted-foreground">{issue.userId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {issue.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 text-primary fill-primary" />
                        {issue.rating.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          {getIssueTypeIcon(issue.issueType)}
                          <span className="font-medium">{issue.issueType}</span>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {issue.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">{issue.incidents}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs border ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={issue.status === 'RESOLVED' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {issue.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTakeAction(issue)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Take Action
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Search className="mr-2 h-4 w-4" />
                            View Full History
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                            Review Details
                          </DropdownMenuItem>
                          {issue.severity === 'CRITICAL' && (
                            <DropdownMenuItem className="text-red-500">
                              <Ban className="mr-2 h-4 w-4" />
                              Blacklist User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {selectedTab === 'history' && (
            <Table>
              <TableHeader>
                <TableRow className="border-border/20">
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Previous</TableHead>
                  <TableHead className="text-muted-foreground">Current</TableHead>
                  <TableHead className="text-muted-foreground">Change</TableHead>
                  <TableHead className="text-muted-foreground">Action</TableHead>
                  <TableHead className="text-muted-foreground">Reason</TableHead>
                  <TableHead className="text-muted-foreground">By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratingHistory.map((history) => (
                  <TableRow key={history.id} className="border-border/10 hover:bg-muted/50">
                    <TableCell className="text-xs text-muted-foreground">{history.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{history.userName}</p>
                        <p className="text-xs text-muted-foreground">{history.userRole}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{history.previousRating.toFixed(1)}</TableCell>
                    <TableCell className="text-sm font-semibold">{history.rating.toFixed(1)}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 text-sm font-semibold ${
                        history.change > 0 ? 'text-green-500' :
                        history.change < 0 ? 'text-red-500' :
                        'text-muted-foreground'
                      }`}>
                        {history.change > 0 && <TrendingUp className="h-3 w-3" />}
                        {history.change < 0 && <TrendingDown className="h-3 w-3" />}
                        {history.change > 0 ? '+' : ''}{history.change.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          history.action === 'DOWNGRADE' ? 'destructive' :
                          history.action === 'UPGRADE' ? 'default' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {history.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {history.reason}
                    </TableCell>
                    <TableCell className="text-sm">{history.actionedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {selectedTab === 'blacklist' && (
            <Table>
              <TableHeader>
                <TableRow className="border-border/20">
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Reason</TableHead>
                  <TableHead className="text-muted-foreground">Blacklist Date</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Reported By</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blacklistedUsers.map((user) => (
                  <TableRow key={user.id} className="border-border/10 hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-red-500/10">
                          <AvatarFallback className="text-red-500 text-xs font-semibold">
                            {user.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.userName}</p>
                          <p className="text-xs text-muted-foreground">{user.userId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {user.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                      {user.reason}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.blacklistDate}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.status === 'PERMANENT' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {user.status}
                      </Badge>
                      {user.expiryDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Until: {user.expiryDate}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{user.reportedBy}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-amber-500">
                        Review Appeal
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onOpenChange={setActionDialog}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Take Action on {selectedIssue?.userName}</DialogTitle>
            <DialogDescription>
              {selectedIssue?.issueType} - {selectedIssue?.severity} Priority
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Action Type</Label>
              <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WARNING">Send Warning</SelectItem>
                  <SelectItem value="DOWNGRADE">Downgrade Rating</SelectItem>
                  <SelectItem value="SUSPEND">Temporary Suspension</SelectItem>
                  <SelectItem value="BLACKLIST">Blacklist User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Explain the reason for this action..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={4}
                className="bg-background"
              />
            </div>
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm font-semibold text-red-500 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Warning
              </p>
              <p className="text-xs text-red-500/80 mt-1">
                This action will notify the user and affect their account status.
                Blacklisting cannot be undone without administrative approval.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(false)}>
              Cancel
            </Button>
            <Button
              className={
                actionType === 'BLACKLIST' ? 'bg-red-500 hover:bg-red-600' :
                actionType === 'SUSPEND' ? 'bg-amber-500 hover:bg-amber-600' :
                'bg-primary text-primary-foreground'
              }
              onClick={handleActionSubmit}
            >
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Fix import
function History({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>;
}
