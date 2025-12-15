import { useState, useEffect } from 'react';
import { supabase, Database } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import { Bell, Gift, RefreshCw, Package } from 'lucide-react';

type Notification = Database['notifications'];

export function Notifications() {
  const { user } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data as Notification[]);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connectez-vous pour voir vos notifications
          </h2>
          <p className="text-gray-600">
            Créez un compte pour recevoir des alertes sur les nouveaux plats et promotions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">
            Restez informé des nouveaux plats, promotions et événements
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Aucune notification
            </h2>
            <p className="text-gray-600">
              Vous recevrez des notifications ici dès qu'il y aura du nouveau.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    notification.type === 'restock'
                      ? 'bg-blue-100'
                      : notification.type === 'promotion'
                      ? 'bg-orange-100'
                      : 'bg-purple-100'
                  }`}>
                    {notification.type === 'restock' ? (
                      <Package className={`w-6 h-6 ${
                        notification.type === 'restock'
                          ? 'text-blue-600'
                          : notification.type === 'promotion'
                          ? 'text-orange-600'
                          : 'text-purple-600'
                      }`} />
                    ) : notification.type === 'promotion' ? (
                      <Gift className="w-6 h-6 text-orange-600" />
                    ) : (
                      <Bell className="w-6 h-6 text-purple-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimeAgo(new Date(notification.created_at))}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {notification.message}
                    </p>
                    {notification.link_url && (
                      <a
                        href={notification.link_url}
                        className="text-sm text-primary font-medium hover:underline"
                      >
                        En savoir plus
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `il y a ${diffDays}j`;
  if (diffHours > 0) return `il y a ${diffHours}h`;
  if (diffMins > 0) return `il y a ${diffMins}min`;
  return `à l'instant`;
}
