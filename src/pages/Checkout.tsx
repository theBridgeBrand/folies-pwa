import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useBadges } from '../contexts/BadgeContext';
import { supabase, Database } from '../lib/supabase';
import { updateOrderStats, checkAndUnlockBadges } from '../lib/badges';
import { Smartphone, X, Loader2, Lock, Star } from 'lucide-react';

type Dish = Database['dishes'];
type Inventory = Database['fridge_inventory'];

interface DishWithInventory extends Dish {
  inventory: Inventory;
}

interface CheckoutProps {
  dish: DishWithInventory;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export function Checkout({ dish, onClose, onSuccess }: CheckoutProps) {
  const { user, currentFridge, userProfile, refreshUserProfile } = useApp();
  const { showBadgeNotification } = useBadges();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [usePoints, setUsePoints] = useState(false);

  const price = dish.inventory.promotion_price || dish.price;
  const loyaltyPoints = userProfile?.loyalty_points || 0;
  const maxPointsUsable = Math.min(loyaltyPoints, Math.floor(price * 10));
  const pointsDiscount = usePoints ? maxPointsUsable / 10 : 0;
  const finalPrice = Math.max(0, price - pointsDiscount);

  const handlePayAndUnlock = async () => {
    if (!user || !currentFridge) return;

    setIsProcessing(true);
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { data: unlockCodeData } = await supabase.rpc('generate_unlock_code');

      if (usePoints && maxPointsUsable > 0) {
        await supabase
          .from('users')
          .update({
            loyalty_points: loyaltyPoints - maxPointsUsable,
          })
          .eq('id', user.id);
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          fridge_id: currentFridge.id,
          dish_id: dish.id,
          quantity: 1,
          unit_price: price,
          total_amount: finalPrice,
          payment_method: 'nfc',
          payment_status: 'completed',
          payment_ref: `NFC-${Date.now()}`,
          unlock_code: unlockCodeData || Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
          is_collected: true,
          collected_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      await updateOrderStats(user.id, finalPrice);
      const newBadges = await checkAndUnlockBadges(user.id);

      newBadges.forEach((badge) => {
        if (badge.badge_types) {
          showBadgeNotification(badge.badge_types as any);
        }
      });

      await refreshUserProfile();
      onSuccess(order.id);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Une erreur est survenue lors du paiement');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-6 flex items-center justify-center">
        <div className="bg-card rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-primary-700 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Lock className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Déverrouiller</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                disabled={isProcessing}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-white/90 text-sm">
              Présentez votre téléphone pour déverrouiller le frigo
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <img
                src={dish.image_url}
                alt={dish.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">{dish.name}</h3>
                <div className="flex items-baseline gap-2">
                  {usePoints && pointsDiscount > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-primary">{finalPrice.toFixed(2)}€</p>
                      <p className="text-sm text-gray-500 line-through">{price.toFixed(2)}€</p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-primary">{price.toFixed(2)}€</p>
                  )}
                </div>
              </div>
            </div>

            {loyaltyPoints > 0 && maxPointsUsable > 0 && (
              <div className="mb-4 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-gray-900">
                        Utiliser mes points de fidélité
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Vous avez <strong>{loyaltyPoints} points</strong>. Utilisez{' '}
                      <strong>{maxPointsUsable} points</strong> pour économiser{' '}
                      <strong className="text-primary">{pointsDiscount.toFixed(2)}€</strong>
                    </p>
                  </div>
                </label>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={handlePayAndUnlock}
              disabled={isProcessing}
              className="w-full bg-primary text-white font-semibold py-5 rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mb-4"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <div className="text-left">
                    <div className="font-bold">Déverrouillage en cours...</div>
                    <div className="text-sm text-white/80">Paiement en traitement</div>
                  </div>
                </>
              ) : (
                <>
                  <Smartphone className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-bold">
                      Payer {finalPrice.toFixed(2)}€ et déverrouiller
                    </div>
                    <div className="text-sm text-white/90">Sans contact (NFC)</div>
                  </div>
                </>
              )}
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-xs text-blue-900 mb-2">
                <strong>Comment ça marche ?</strong>
              </p>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Présentez votre téléphone au lecteur NFC</li>
                <li>Le paiement est traité automatiquement</li>
                <li>Le frigo se déverrouille instantanément</li>
                <li>Prenez votre plat et refermez la porte</li>
              </ol>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-xs text-emerald-900 text-center">
                <strong>+{Math.floor(finalPrice)} points</strong> ajoutés à votre compte après achat
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
