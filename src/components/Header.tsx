import { MapPin, User, Bell, Gift } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const { currentFridge, user } = useApp();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .is('sent_at', null);

      if (!error && count) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src="/folies-food-rvb_52.png" alt="Folies Fridge" className="w-8 h-8 object-contain" />
            <div className="text-left">
              <h1 className="text-xl font-bold text-gray-900">Folies Fridge</h1>
              {currentFridge && (
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {currentFridge.name}
                </p>
              )}
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('promotions')}
              className={`p-2 rounded-full transition-colors ${
                currentPage === 'promotions'
                  ? 'bg-primary-100 text-primary'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label="Promotions"
            >
              <Gift className="w-6 h-6" />
            </button>

            {user && (
              <button
                onClick={() => onNavigate('notifications')}
                className={`p-2 rounded-full transition-colors relative ${
                  currentPage === 'notifications'
                    ? 'bg-primary-100 text-primary'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => onNavigate(user ? 'profile' : 'auth')}
              className={`p-2 rounded-full transition-colors ${
                currentPage === 'profile' || currentPage === 'auth'
                  ? 'bg-primary-100 text-primary'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label="Profil"
            >
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
