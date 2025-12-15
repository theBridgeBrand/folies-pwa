import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { BadgeType, getColorClasses } from '../lib/badges';

interface BadgeUnlockNotificationProps {
  badge: BadgeType;
  onClose: () => void;
}

export function BadgeUnlockNotification({ badge, onClose }: BadgeUnlockNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const colors = getColorClasses(badge.color);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`${colors.bg} border-2 ${colors.border} rounded-xl p-4 shadow-2xl max-w-sm`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="text-4xl animate-bounce">{badge.icon}</div>
              <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={`font-bold ${colors.text}`}>Badge Débloqué!</h3>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-semibold text-gray-900 mb-1">{badge.name}</p>
            <p className="text-sm text-gray-600 mb-2">{badge.description}</p>

            <div className="flex items-center gap-2">
              <div className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-medium`}>
                +{badge.xp_reward} XP
              </div>
              <Sparkles className="w-3 h-3 text-orange-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
