import { createContext, useContext, useState, ReactNode } from 'react';
import { BadgeType } from '../lib/badges';
import { BadgeUnlockNotification } from '../components/BadgeUnlockNotification';

interface BadgeContextType {
  showBadgeNotification: (badge: BadgeType) => void;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export function BadgeProvider({ children }: { children: ReactNode }) {
  const [unlockedBadges, setUnlockedBadges] = useState<BadgeType[]>([]);

  const showBadgeNotification = (badge: BadgeType) => {
    setUnlockedBadges((prev) => [...prev, badge]);
  };

  const removeBadgeNotification = (badgeId: string) => {
    setUnlockedBadges((prev) => prev.filter((b) => b.id !== badgeId));
  };

  return (
    <BadgeContext.Provider value={{ showBadgeNotification }}>
      {children}
      {unlockedBadges.map((badge) => (
        <BadgeUnlockNotification
          key={badge.id}
          badge={badge}
          onClose={() => removeBadgeNotification(badge.id)}
        />
      ))}
    </BadgeContext.Provider>
  );
}

export function useBadges() {
  const context = useContext(BadgeContext);
  if (context === undefined) {
    throw new Error('useBadges must be used within a BadgeProvider');
  }
  return context;
}
