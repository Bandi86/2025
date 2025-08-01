'use client';

import React from 'react';
import { EnhancedNavigation } from '@/components/home/enhanced-navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
} 