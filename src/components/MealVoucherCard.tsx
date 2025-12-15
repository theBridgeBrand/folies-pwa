import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MealVoucherCardType {
  id: string;
  user_id: string;
  card_name: string;
  card_type: string;
  card_number: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface MealVoucherCardProps {
  userId: string;
  onUpdate?: () => void;
}

const CARD_TYPES = [
  { value: 'swile', label: 'Swile', color: 'from-green-500 to-green-700' },
  { value: 'conecs', label: 'Conecs', color: 'from-blue-500 to-blue-700' },
  { value: 'edenred', label: 'Edenred', color: 'from-red-500 to-red-700' },
  { value: 'sodexo', label: 'Sodexo', color: 'from-purple-500 to-purple-700' },
  { value: 'up', label: 'Up Déjeuner', color: 'from-orange-500 to-orange-700' },
  { value: 'autre', label: 'Autre', color: 'from-gray-500 to-gray-700' },
];

export function MealVoucherCard({ userId, onUpdate }: MealVoucherCardProps) {
  const [cards, setCards] = useState<MealVoucherCardType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const [newCard, setNewCard] = useState({
    card_name: '',
    card_type: 'swile',
    card_number: '',
  });

  useEffect(() => {
    loadCards();
  }, [userId]);

  const loadCards = async () => {
    try {
      const { data, error: loadError } = await supabase
        .from('meal_voucher_cards')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (loadError) throw loadError;
      setCards(data || []);
    } catch (err: any) {
      console.error('Error loading cards:', err);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCard.card_name.trim() || !newCard.card_number.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (newCard.card_number.length < 4) {
      setError('Veuillez entrer au moins 4 chiffres');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const isFirstCard = cards.length === 0;

      const { error: insertError } = await supabase
        .from('meal_voucher_cards')
        .insert({
          user_id: userId,
          card_name: newCard.card_name.trim(),
          card_type: newCard.card_type,
          card_number: newCard.card_number.slice(-4),
          is_default: isFirstCard,
        });

      if (insertError) throw insertError;

      setNewCard({ card_name: '', card_type: 'swile', card_number: '' });
      setIsAdding(false);
      await loadCards();
      onUpdate?.();
    } catch (err: any) {
      console.error('Error adding card:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (cardId: string) => {
    setIsLoading(true);
    setError('');

    try {
      await supabase
        .from('meal_voucher_cards')
        .update({ is_default: false })
        .eq('user_id', userId);

      const { error: updateError } = await supabase
        .from('meal_voucher_cards')
        .update({ is_default: true })
        .eq('id', cardId);

      if (updateError) throw updateError;

      await loadCards();
      onUpdate?.();
    } catch (err: any) {
      console.error('Error setting default:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette carte ?')) return;

    setIsLoading(true);
    setError('');

    try {
      const { error: deleteError } = await supabase
        .from('meal_voucher_cards')
        .delete()
        .eq('id', cardId);

      if (deleteError) throw deleteError;

      await loadCards();
      onUpdate?.();
    } catch (err: any) {
      console.error('Error deleting card:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const getCardColor = (cardType: string) => {
    return CARD_TYPES.find((t) => t.value === cardType)?.color || 'from-gray-500 to-gray-700';
  };

  const getCardLabel = (cardType: string) => {
    return CARD_TYPES.find((t) => t.value === cardType)?.label || cardType;
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" />
        Mes cartes restaurant
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              card.is_default
                ? 'border-primary bg-primary-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${getCardColor(card.card_type)} rounded-xl flex items-center justify-center`}>
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{card.card_name}</h4>
                  <p className="text-sm text-gray-600">
                    {getCardLabel(card.card_type)} •••• {card.card_number}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {card.is_default ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <button
                    onClick={() => handleSetDefault(card.id)}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm text-primary hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Par défaut
                  </button>
                )}
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  disabled={isLoading}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Supprimer la carte"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={isLoading}
            className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2 text-gray-700 hover:text-primary">
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Ajouter une carte restaurant</span>
            </div>
          </button>
        )}

        {isAdding && (
          <form onSubmit={handleAddCard} className="p-4 rounded-xl border-2 border-primary bg-primary-50">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la carte
                </label>
                <input
                  type="text"
                  value={newCard.card_name}
                  onChange={(e) => setNewCard({ ...newCard, card_name: e.target.value })}
                  placeholder="Ex: Ma carte Swile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de carte
                </label>
                <select
                  value={newCard.card_type}
                  onChange={(e) => setNewCard({ ...newCard, card_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isLoading}
                >
                  {CARD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4 derniers chiffres
                </label>
                <input
                  type="text"
                  value={newCard.card_number}
                  onChange={(e) => setNewCard({ ...newCard, card_number: e.target.value.replace(/\D/g, '') })}
                  placeholder="1234"
                  maxLength={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Ajout...' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewCard({ card_name: '', card_type: 'swile', card_number: '' });
                    setError('');
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-900">
          <strong>Info :</strong> Vos cartes restaurant sont enregistrées pour faciliter le suivi de vos achats. Les paiements s'effectuent en NFC au frigo.
        </p>
      </div>
    </div>
  );
}
