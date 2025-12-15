import { useState, useEffect } from 'react';
import { supabase, Database } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import { PromotionCard } from '../components/PromotionCard';
import { RefreshCw, Gift } from 'lucide-react';

type Promotion = Database['promotions'];

export function Promotions() {
  const { currentFridge } = useApp();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, [currentFridge]);

  const loadPromotions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const filtered = (data as Promotion[]).filter((promo) => {
        if (!promo.fridge_ids || promo.fridge_ids.length === 0) {
          return true;
        }
        return currentFridge && promo.fridge_ids.includes(currentFridge.id);
      });

      setPromotions(filtered);
    } catch (err) {
      console.error('Error loading promotions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Actualités & Offres</h2>
          <p className="text-gray-600">
            Découvrez nos promotions et événements du moment
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-20">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucune offre disponible pour le moment</p>
            <p className="text-gray-500 text-sm mt-2">Revenez bientôt pour découvrir nos promotions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {promotions.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
