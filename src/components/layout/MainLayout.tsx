import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { UserMenu } from '@/components/auth/UserMenu';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, loading } = useAuth();
  const { collapsed } = useSidebarContext();
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

      <main 
        className={cn(
          'min-h-screen transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Top bar with user menu - now inside main content area */}
        <div className="sticky top-0 z-40 flex justify-end p-4 pointer-events-none">
          <div className="pointer-events-auto">
            <UserMenu />
          </div>
        </div>

        {/* Page content with negative margin to account for top bar */}
        <div className="-mt-16">
          {children}
        </div>
      </main>

      {/* Onboarding modal for new users */}
      <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
    </div>
  );
}
