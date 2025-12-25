'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  MapPin,
  DollarSign,
  FileText,
  Settings,
  Truck,
  Activity,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, id: 'dashboard' },
  { name: 'Live Map', href: '#map', icon: MapPin, id: 'map' },
  { name: 'Drivers', href: '#drivers', icon: Truck, id: 'drivers' },
  { name: 'Trips', href: '#trips', icon: FileText, id: 'trips' },
  { name: 'Transactions', href: '#transactions', icon: DollarSign, id: 'transactions' },
  { name: 'Analytics', href: '#analytics', icon: Activity, id: 'analytics' },
  { name: 'Users', href: '#users', icon: Users, id: 'users' },
  { name: 'Settings', href: '#settings', icon: Settings, id: 'settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.location.hash = href;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/20 bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border/20 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <span className="text-sm font-bold text-primary-foreground">T</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">TRIPPO.OS</h1>
              <p className="text-[10px] text-muted-foreground">LOGISTICS PLATFORM</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === '/' && (window.location.hash.slice(1) || 'dashboard') === item.id;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="border-t border-border/20 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">System Status</span>
              <span className="flex items-center gap-1.5 text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Database</span>
              <span className="text-green-500">Connected</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">WebSocket</span>
              <span className="text-green-500">Active</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
