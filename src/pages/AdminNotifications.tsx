import { useState, useEffect } from 'react';
import { supabase, Database } from '../lib/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { Send, RefreshCw } from 'lucide-react';

type Notification = Database['notifications'];
type Fridge = Database['fridges'];

interface AdminNotificationsProps {
  onBack: () => void;
  onNavigateDishes: () => void;
  onNavigatePolls: () => void;
}

export function AdminNotifications({ onBack, onNavigateDishes, onNavigatePolls }: AdminNotificationsProps) {
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleTabChange = (tab: 'dishes' | 'notifications' | 'polls') => {
    if (tab === 'dishes') onNavigateDishes();
    else if (tab === 'polls') onNavigatePolls();
  };

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'restock' as 'restock' | 'promotion' | 'game',
    fridge_id: '',
    link_url: '',
  });

  useEffect(() => {
    loadFridges();
    loadNotifications();
  }, []);

  const loadFridges = async () => {
    try {
      const { data, error } = await supabase
        .from('fridges')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setFridges(data as Fridge[]);
    } catch (err) {
      console.error('Error loading fridges:', err);
    }
  };

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data as Notification[]);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      alert('Veuillez remplir le titre et le message');
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from('notifications').insert({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        fridge_id: formData.fridge_id || null,
        link_url: formData.link_url || null,
        sent_at: new Date().toISOString(),
      });

      if (error) throw error;

      setFormData({
        title: '',
        message: '',
        type: 'restock',
        fridge_id: '',
        link_url: '',
      });

      loadNotifications();
      alert('Notification envoyée avec succès!');
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('Erreur lors de l\'envoi de la notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminLayout activeTab="notifications" onBack={onBack} onTabChange={handleTabChange}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Envoyer une notification
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Nouveaux plats disponibles"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Décrivez votre notification..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="restock">Réassort</option>
                <option value="promotion">Promotion</option>
                <option value="game">Jeu</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frigo (optionnel)
              </label>
              <select
                value={formData.fridge_id}
                onChange={(e) => setFormData({ ...formData, fridge_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Tous les frigos</option>
                {fridges.map((fridge) => (
                  <option key={fridge.id} value={fridge.id}>
                    {fridge.name} - {fridge.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lien (optionnel)
              </label>
              <input
                type="text"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="URL vers une page spécifique"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={isSending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {isSending ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isSending ? 'Envoi...' : 'Envoyer la notification'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Historique des notifications
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600">Aucune notification envoyée</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        notification.type === 'restock'
                          ? 'bg-blue-100 text-blue-700'
                          : notification.type === 'promotion'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {getTypeLabel(notification.type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {notification.sent_at
                        ? new Date(notification.sent_at).toLocaleString('fr-FR')
                        : 'Non envoyée'}
                    </span>
                    {notification.fridge_id && (
                      <span className="px-2 py-1 bg-gray-200 rounded">
                        Frigo spécifique
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    restock: 'Réassort',
    promotion: 'Promotion',
    game: 'Jeu',
  };
  return labels[type] || type;
}
