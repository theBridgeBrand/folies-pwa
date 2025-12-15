import { useState } from 'react';
import { CreditCard, Smartphone, Trash2, Plus, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentMethodCardProps {
  userId: string;
  paygreenCardId: string | null;
  paygreenCardLast4: string | null;
  paygreenCardType: string | null;
  defaultPaymentMethod: 'nfc' | 'paygreen';
  onUpdate: () => void;
}

export function PaymentMethodCard({
  userId,
  paygreenCardId,
  paygreenCardLast4,
  paygreenCardType,
  defaultPaymentMethod,
  onUpdate,
}: PaymentMethodCardProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddPaygreenCard = async () => {
    setIsAddingCard(true);
    setError('');
    setIsLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paygreen-register-card`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      }

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch (err: any) {
      console.error('Error adding PayGreen card:', err);
      setError(err.message || 'Une erreur est survenue');
      setIsLoading(false);
      setIsAddingCard(false);
    }
  };

  const handleRemoveCard = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cette carte ?')) return;

    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          paygreen_card_id: null,
          paygreen_card_last4: null,
          paygreen_card_type: null,
          default_payment_method: 'nfc',
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      onUpdate();
    } catch (err: any) {
      console.error('Error removing card:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (method: 'nfc' | 'paygreen') => {
    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ default_payment_method: method })
        .eq('id', userId);

      if (updateError) throw updateError;

      onUpdate();
    } catch (err: any) {
      console.error('Error setting default:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" />
        Moyens de paiement
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <div
          className={`p-4 rounded-xl border-2 transition-all ${
            defaultPaymentMethod === 'nfc'
              ? 'border-primary bg-primary-50'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-700 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Paiement NFC</h4>
                <p className="text-sm text-gray-600">Apple Pay / Google Pay / Carte sans contact</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {defaultPaymentMethod === 'nfc' && (
                <CheckCircle className="w-5 h-5 text-primary" />
              )}
              {defaultPaymentMethod !== 'nfc' && (
                <button
                  onClick={() => handleSetDefault('nfc')}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm text-primary hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Par défaut
                </button>
              )}
            </div>
          </div>
        </div>

        {paygreenCardId ? (
          <div
            className={`p-4 rounded-xl border-2 transition-all ${
              defaultPaymentMethod === 'paygreen'
                ? 'border-primary bg-primary-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    Carte Restaurant {paygreenCardType ? `(${paygreenCardType})` : ''}
                  </h4>
                  <p className="text-sm text-gray-600">•••• {paygreenCardLast4}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {defaultPaymentMethod === 'paygreen' && (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
                {defaultPaymentMethod !== 'paygreen' && (
                  <button
                    onClick={() => handleSetDefault('paygreen')}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm text-primary hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Par défaut
                  </button>
                )}
                <button
                  onClick={handleRemoveCard}
                  disabled={isLoading}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Supprimer la carte"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleAddPaygreenCard}
            disabled={isLoading || isAddingCard}
            className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2 text-gray-700 hover:text-primary">
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Ajouter une carte restaurant PayGreen</span>
            </div>
          </button>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-900">
          <strong>Tickets restaurant acceptés</strong> - Payez avec votre carte restaurant PayGreen (Swile, Conecs, etc.)
        </p>
      </div>
    </div>
  );
}
