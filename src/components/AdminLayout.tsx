import { ReactNode } from 'react';
import { useApp } from '../contexts/AppContext';
import { Package, Bell, TrendingUp, ArrowLeft } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: 'dishes' | 'notifications' | 'polls';
  onBack: () => void;
  onTabChange?: (tab: 'dishes' | 'notifications' | 'polls') => void;
}

export function AdminLayout({ children, activeTab, onBack, onTabChange }: AdminLayoutProps) {
  const { isAdmin } = useApp();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions d'administrateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Administration</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm mb-6 p-1 flex gap-2">
          <button
            onClick={() => onTabChange?.('dishes')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'dishes'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Package className="w-5 h-5" />
              <span>Gestion des plats</span>
            </div>
          </button>
          <button
            onClick={() => onTabChange?.('polls')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'polls'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Sondages</span>
            </div>
          </button>
          <button
            onClick={() => onTabChange?.('notifications')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'notifications'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </div>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
