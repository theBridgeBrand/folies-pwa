import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { BadgeProvider } from './contexts/BadgeContext';
import { Header } from './components/Header';
import { FloatingScanPay } from './components/FloatingScanPay';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { DishDetail } from './pages/DishDetail';
import { Promotions } from './pages/Promotions';
import { Auth } from './pages/Auth';
import { Profile } from './pages/Profile';
import { QuickPay } from './pages/QuickPay';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Notifications } from './pages/Notifications';
import { AdminDishes } from './pages/AdminDishes';
import { AdminNotifications } from './pages/AdminNotifications';
import AdminPolls from './pages/AdminPolls';
import { Database } from './lib/supabase';

type Dish = Database['dishes'];
type Inventory = Database['fridge_inventory'];

interface DishWithInventory extends Dish {
  inventory: Inventory;
}

type Page = 'onboarding' | 'home' | 'promotions' | 'auth' | 'profile' | 'notifications' | 'admin-dishes' | 'admin-notifications' | 'admin-polls';

function AppContent() {
  const { currentFridge, user, isAdmin } = useApp();
  const [currentPage, setCurrentPage] = useState<Page>('onboarding');
  const [selectedDish, setSelectedDish] = useState<DishWithInventory | null>(null);
  const [showQuickPay, setShowQuickPay] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (currentFridge && currentPage === 'onboarding') {
      setCurrentPage('home');
    }
  }, [currentFridge]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    setSelectedDish(null);
    setShowQuickPay(false);
    setOrderId(null);
  };

  const handleDishClick = (dish: DishWithInventory) => {
    setSelectedDish(dish);
  };

  const handleChangeFridge = () => {
    setCurrentPage('onboarding');
  };

  const handleShowQuickPay = () => {
    if (!user) {
      setCurrentPage('auth');
      return;
    }
    setShowQuickPay(true);
  };

  const handleOrderSuccess = (newOrderId: string) => {
    setShowQuickPay(false);
    setOrderId(newOrderId);
  };

  const handleCloseOrder = () => {
    setOrderId(null);
    setCurrentPage('home');
  };

  if (orderId) {
    return <OrderConfirmation orderId={orderId} onClose={handleCloseOrder} />;
  }

  if (currentPage === 'onboarding' || !currentFridge) {
    return <Onboarding onComplete={() => setCurrentPage('home')} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigate} currentPage={currentPage} />

      {currentPage === 'home' && (
        <Home onDishClick={handleDishClick} onChangeFridge={handleChangeFridge} />
      )}

      {currentPage === 'promotions' && <Promotions />}

      {currentPage === 'notifications' && <Notifications />}

      {currentPage === 'auth' && <Auth onSuccess={() => setCurrentPage('profile')} />}

      {currentPage === 'profile' && user && <Profile onNavigateAdmin={() => setCurrentPage('admin-dishes')} isAdmin={isAdmin} />}

      {currentPage === 'admin-dishes' && isAdmin && (
        <AdminDishes
          onBack={() => setCurrentPage('profile')}
          onNavigateNotifications={() => setCurrentPage('admin-notifications')}
          onNavigatePolls={() => setCurrentPage('admin-polls')}
        />
      )}

      {currentPage === 'admin-polls' && isAdmin && (
        <AdminPolls
          onBack={() => setCurrentPage('profile')}
          onNavigateDishes={() => setCurrentPage('admin-dishes')}
          onNavigateNotifications={() => setCurrentPage('admin-notifications')}
        />
      )}

      {currentPage === 'admin-notifications' && isAdmin && (
        <AdminNotifications
          onBack={() => setCurrentPage('profile')}
          onNavigateDishes={() => setCurrentPage('admin-dishes')}
          onNavigatePolls={() => setCurrentPage('admin-polls')}
        />
      )}

      {selectedDish && (
        <DishDetail
          dish={selectedDish}
          onClose={() => setSelectedDish(null)}
        />
      )}

      {showQuickPay && (
        <QuickPay
          onClose={() => setShowQuickPay(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {(currentPage === 'home' || currentPage === 'promotions') && (
        <FloatingScanPay onClick={handleShowQuickPay} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BadgeProvider>
        <AppContent />
      </BadgeProvider>
    </AppProvider>
  );
}
