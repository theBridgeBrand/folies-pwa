import { Database } from '../lib/supabase';
import { Gift, Trophy, Clock, Sparkles } from 'lucide-react';

type Promotion = Database['promotions'];

interface PromotionCardProps {
  promotion: Promotion;
}

export function PromotionCard({ promotion }: PromotionCardProps) {
  const getIcon = () => {
    switch (promotion.type) {
      case 'discount':
      case 'happy_hour':
        return <Clock className="w-6 h-6" />;
      case 'contest':
        return <Trophy className="w-6 h-6" />;
      case 'game':
        return <Sparkles className="w-6 h-6" />;
      default:
        return <Gift className="w-6 h-6" />;
    }
  };

  const getColorClasses = () => {
    switch (promotion.type) {
      case 'discount':
      case 'happy_hour':
        return 'bg-gradient-to-br from-primary to-primary-600';
      case 'contest':
        return 'bg-gradient-to-br from-amber-500 to-orange-600';
      case 'game':
        return 'bg-gradient-to-br from-primary-400 to-primary';
      default:
        return 'bg-gradient-to-br from-primary to-primary-700';
    }
  };

  const endDate = new Date(promotion.end_date);
  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className={`${getColorClasses()} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-start gap-4">
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
          {getIcon()}
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-xl mb-2">{promotion.title}</h3>
          <p className="text-white/90 text-sm mb-3">{promotion.description}</p>

          <div className="flex items-center gap-4 text-sm">
            {promotion.discount_percentage && (
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-semibold">
                -{promotion.discount_percentage}%
              </span>
            )}
            <span className="text-white/80">
              {daysLeft > 1 ? `${daysLeft} jours restants` : 'Dernier jour !'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
