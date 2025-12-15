import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { supabase, Database } from '../lib/supabase';
import { Trophy, Star, LogOut, Bell, Heart, ShoppingBag, Settings, Award } from 'lucide-react';
import { BadgeCard } from '../components/BadgeCard';
import { UserProgress } from '../components/UserProgress';
import { MealVoucherCard } from '../components/MealVoucherCard';
import { BadgeType, UserBadge, UserStats, initializeUserStats } from '../lib/badges';

type Order = Database['orders'] & {
  dishes: Database['dishes'];
  fridges: Database['fridges'];
};

interface ProfileProps {
  onNavigateAdmin: () => void;
  isAdmin: boolean;
}

export function Profile({ onNavigateAdmin, isAdmin }: ProfileProps) {
  const { user, userProfile, signOut, refreshUserProfile } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadOrders();
      ensureUserProfile();
      loadBadgesAndStats();
    }
  }, [user]);

  const loadBadgesAndStats = async () => {
    if (!user) return;

    await initializeUserStats(user.id);

    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (stats) setUserStats(stats);

    const { data: badges } = await supabase
      .from('badge_types')
      .select('*')
      .order('category')
      .order('level');

    if (badges) setAllBadges(badges);

    const { data: unlockedBadges } = await supabase
      .from('user_badges')
      .select('*, badge_types(*)')
      .eq('user_id', user.id);

    if (unlockedBadges) setUserBadges(unlockedBadges as any);
  };

  const ensureUserProfile = async () => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('users').insert({
        id: user.id,
        email: user.email!,
        loyalty_points: 0,
        loyalty_tier: 'bronze',
      });
      await refreshUserProfile();
    }
  };

  const loadOrders = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          dishes (*),
          fridges (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'text-purple-600 bg-purple-100';
      case 'gold':
        return 'text-amber-600 bg-amber-100';
      case 'silver':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-orange-600 bg-orange-100';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'Platine';
      case 'gold':
        return 'Or';
      case 'silver':
        return 'Argent';
      default:
        return 'Bronze';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échouée';
      case 'refunded':
        return 'Remboursée';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-700 bg-emerald-100';
      case 'pending':
        return 'text-orange-700 bg-orange-100';
      case 'failed':
        return 'text-red-700 bg-red-100';
      case 'refunded':
        return 'text-gray-700 bg-gray-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-primary to-primary-700 rounded-3xl p-6 text-white mb-6 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Bonjour</h2>
              <p className="text-white/90">{userProfile.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5" />
                <span className="text-sm font-medium">Points fidélité</span>
              </div>
              <p className="text-3xl font-bold">{userProfile.loyalty_points}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-medium">Statut</span>
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTierColor(
                  userProfile.loyalty_tier
                )}`}
              >
                {getTierLabel(userProfile.loyalty_tier)}
              </span>
            </div>
          </div>
        </div>

        {userStats && (
          <>
            <UserProgress
              stats={userStats}
              badgeCount={userBadges.length}
              loyaltyPoints={userProfile.loyalty_points}
              onUpdate={() => {
                loadBadgesAndStats();
                refreshUserProfile();
              }}
            />

            <div className="bg-card rounded-2xl p-6 mt-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Mes Badges ({userBadges.length}/{allBadges.length})
                </h3>
              </div>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                {['orders', 'spending', 'streak', 'voting', 'special'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'orders' && 'Commandes'}
                    {cat === 'spending' && 'Dépenses'}
                    {cat === 'streak' && 'Séries'}
                    {cat === 'voting' && 'Votes'}
                    {cat === 'special' && 'Spéciaux'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {allBadges
                  .filter((badge) => selectedCategory === 'all' || badge.category === selectedCategory)
                  .map((badge) => {
                    const userBadge = userBadges.find((ub) => ub.badge_type_id === badge.id);
                    const isUnlocked = !!userBadge;

                    let progress = 0;
                    if (!isUnlocked && userStats) {
                      switch (badge.category) {
                        case 'orders':
                          progress = userStats.total_orders;
                          break;
                        case 'spending':
                          progress = Number(userStats.total_spent);
                          break;
                        case 'streak':
                          progress = userStats.longest_streak;
                          break;
                        case 'voting':
                          progress = userStats.polls_voted;
                          break;
                      }
                    }

                    return (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        isUnlocked={isUnlocked}
                        progress={progress}
                      />
                    );
                  })}
              </div>
            </div>
          </>
        )}

        {isAdmin && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 mt-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Administration
                </h3>
                <p className="text-white/90 text-sm">
                  Gérer les plats et envoyer des notifications
                </p>
              </div>
              <button
                onClick={onNavigateAdmin}
                className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-md"
              >
                Accéder
              </button>
            </div>
          </div>
        )}

        <MealVoucherCard
          userId={user.id}
          onUpdate={() => {
            refreshUserProfile();
          }}
        />

        <div className="bg-card rounded-2xl p-6 mt-6 mb-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Préférences de notifications
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-gray-700">Réassorts</span>
              <input
                type="checkbox"
                checked={userProfile.notification_preferences.restock}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
                readOnly
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-gray-700">Promotions</span>
              <input
                type="checkbox"
                checked={userProfile.notification_preferences.promotions}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
                readOnly
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-gray-700">Jeux et concours</span>
              <input
                type="checkbox"
                checked={userProfile.notification_preferences.games}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
                readOnly
              />
            </label>
          </div>
        </div>

        {userProfile.favorite_fridges && userProfile.favorite_fridges.length > 0 && (
          <div className="bg-card rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Frigos favoris
            </h3>
            <p className="text-gray-600">{userProfile.favorite_fridges.length} frigo(s) favori(s)</p>
          </div>
        )}

        <div className="bg-card rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Commandes passées
          </h3>

          {isLoading ? (
            <p className="text-gray-500 text-center py-8">Chargement...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune commande pour le moment</p>
              <p className="text-sm text-gray-400 mt-1">
                Vos achats apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900">
                          {order.quantity}x {order.dishes?.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                            order.payment_status
                          )}`}
                        >
                          {getStatusLabel(order.payment_status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{order.fridges?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {order.total_amount.toFixed(2)}€
                      </p>
                      {order.points_awarded > 0 && (
                        <p className="text-sm text-emerald-600 font-semibold">
                          +{order.points_awarded} pts
                        </p>
                      )}
                    </div>
                  </div>

                  {order.payment_method && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <span>Paiement: {order.payment_method.toUpperCase()}</span>
                      {order.is_collected && (
                        <span className="text-emerald-600">✓ Récupéré</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
