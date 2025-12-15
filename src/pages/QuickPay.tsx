import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { Smartphone, X, Loader2, Lock, QrCode } from 'lucide-react';

interface QuickPayProps {
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export function QuickPay({ onClose, onSuccess }: QuickPayProps) {
  const { user, userProfile, currentFridge, refreshUserProfile } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleQuickUnlock = async () => {
    if (!user || !currentFridge) {
      setError('Veuillez vous connecter pour continuer');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { data: unlockCodeData } = await supabase.rpc('generate_unlock_code');

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          fridge_id: currentFridge.id,
          dish_id: null,
          quantity: 0,
          unit_price: 0,
          total_amount: 0,
          payment_method: 'nfc',
          payment_status: 'completed',
          payment_ref: `QUICK-${Date.now()}`,
          unlock_code: unlockCodeData || Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
          is_collected: false,
          collected_at: null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      await refreshUserProfile();
      onSuccess(order.id);
    } catch (err: any) {
      console.error('Quick unlock error:', err);
      setError(err.message || 'Une erreur est survenue lors du déverrouillage');
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
                <QrCode className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Scan&Pay</h2>
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
              Déverrouillez le frigo et prenez ce que vous voulez
            </p>
          </div>

          <div className="p-6">
            <div className="bg-gradient-to-br from-blue-50 to-primary-50 rounded-2xl p-6 mb-6 border border-primary-200">
              <div className="flex items-start gap-3 mb-4">
                <QrCode className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Comment ça marche ?</h3>
                  <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                    <li>Présentez votre téléphone au lecteur NFC du frigo</li>
                    <li>Le frigo se déverrouille instantanément</li>
                    <li>Prenez l'article que vous souhaitez</li>
                    <li>Le système détecte automatiquement votre choix</li>
                    <li>Le paiement est effectué et vos points sont ajoutés</li>
                  </ol>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={handleQuickUnlock}
              disabled={isProcessing || !user}
              className="w-full bg-primary text-white font-semibold py-5 rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mb-4"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <div className="text-left">
                    <div className="font-bold">Déverrouillage en cours...</div>
                    <div className="text-sm text-white/80">Connexion NFC</div>
                  </div>
                </>
              ) : (
                <>
                  <Smartphone className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-bold">Déverrouiller maintenant</div>
                    <div className="text-sm text-white/90">Paiement sans contact (NFC)</div>
                  </div>
                </>
              )}
            </button>

            {!user && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-900">
                  <strong>Connexion requise :</strong> Vous devez être connecté pour utiliser le Scan&Pay.
                </p>
              </div>
            )}

            {user && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-xs text-emerald-900 text-center">
                  <Lock className="w-4 h-4 inline mr-1" />
                  <strong>Paiement sécurisé</strong> - Vos points seront automatiquement ajoutés
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
