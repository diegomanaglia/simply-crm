import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-16 lg:ml-64 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
