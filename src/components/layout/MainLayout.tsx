import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { UserMenu } from '@/components/auth/UserMenu';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding for new users
    if (!loading && profile && !profile.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [loading, profile]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Top bar with user menu */}
      <div className="fixed top-0 right-0 z-40 p-4">
        <UserMenu />
      </div>

      <main className="ml-16 lg:ml-64 min-h-screen transition-all duration-300">
        {children}
      </main>

      {/* Onboarding modal for new users */}
      <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
    </div>
  );
}
