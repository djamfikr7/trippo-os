'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-border/20 bg-card/80 backdrop-blur-sm">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Admin Dashboard
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Real-time Updates
                  </span>
                </div>
                <div className="flex items-center gap-3 pl-4 border-l border-border/20">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">Admin User</p>
                    <p className="text-xs text-muted-foreground">admin@trippo.os</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    A
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-6">
            {children}
          </div>

          {/* Footer */}
          <footer className="border-t border-border/20 bg-card mt-auto">
            <div className="flex h-12 items-center justify-between px-6">
              <p className="text-xs text-muted-foreground">
                © 2024 Trippo.OS - All rights reserved
              </p>
              <p className="text-xs text-muted-foreground">
                Version 1.0.0 | Neo-Industrial Theme
              </p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
