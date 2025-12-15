import { Database } from '../lib/supabase';

type Dish = Database['dishes'];

interface DishCardProps {
  dish: Dish;
  inventory?: {
    stock: number;
    promotion_price: number | null;
    is_new: boolean;
  };
  onClick: () => void;
}

export function DishCard({ dish, inventory, onClick }: DishCardProps) {
  const hasPromo = inventory?.promotion_price && inventory.promotion_price < dish.price;
  const displayPrice = hasPromo ? inventory.promotion_price : dish.price;
  const lowStock = inventory && inventory.stock < 3;

  return (
    <button
      onClick={onClick}
      className="group w-full bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={dish.image_url}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {inventory?.is_new && (
            <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
              Nouveau
            </span>
          )}
          {dish.is_bestseller && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
              Best-seller
            </span>
          )}
          {hasPromo && (
            <span className="px-2 py-1 bg-primary text-white text-xs font-semibold rounded-full">
              Promo
            </span>
          )}
          {lowStock && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
              Bientôt épuisé
            </span>
          )}
        </div>

        {dish.labels && dish.labels.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {dish.labels.map((label) => (
              <span
                key={label}
                className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-1 text-left line-clamp-2">
          {dish.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 text-left line-clamp-2">
          {dish.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              {displayPrice.toFixed(2)}€
            </span>
            {hasPromo && (
              <span className="text-sm text-gray-400 line-through">
                {dish.price.toFixed(2)}€
              </span>
            )}
          </div>
          {inventory && (
            <span className="text-xs text-gray-500">
              Stock: {inventory.stock}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
