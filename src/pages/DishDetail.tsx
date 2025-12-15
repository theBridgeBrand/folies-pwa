import { X, AlertTriangle, Info } from 'lucide-react';
import { Database } from '../lib/supabase';

type Dish = Database['dishes'];
type Inventory = Database['fridge_inventory'];

interface DishWithInventory extends Dish {
  inventory: Inventory;
}

interface DishDetailProps {
  dish: DishWithInventory;
  onClose: () => void;
}

export function DishDetail({ dish, onClose }: DishDetailProps) {
  const hasPromo = dish.inventory?.promotion_price && dish.inventory.promotion_price < dish.price;
  const displayPrice = hasPromo ? dish.inventory.promotion_price : dish.price;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-6 flex items-center justify-center">
        <div className="bg-card rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
          <div className="relative">
            <img
              src={dish.image_url}
              alt={dish.name}
              className="w-full h-80 object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
            >
              <X className="w-6 h-6 text-gray-900" />
            </button>

            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {dish.inventory?.is_new && (
                <span className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-semibold rounded-full">
                  Nouveau
                </span>
              )}
              {dish.is_bestseller && (
                <span className="px-3 py-1.5 bg-amber-500 text-white text-sm font-semibold rounded-full">
                  Best-seller
                </span>
              )}
              {hasPromo && (
                <span className="px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-full">
                  Promotion
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{dish.name}</h2>
            <p className="text-lg text-gray-600 mb-6">{dish.description}</p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-primary">
                {displayPrice.toFixed(2)}€
              </span>
              {hasPromo && (
                <span className="text-xl text-gray-400 line-through">
                  {dish.price.toFixed(2)}€
                </span>
              )}
            </div>

            {dish.labels && dish.labels.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {dish.labels.map((label) => (
                    <span
                      key={label}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {dish.allergens && dish.allergens.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-1">Allergènes</h3>
                    <p className="text-sm text-amber-800">
                      {dish.allergens.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {dish.inventory && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Disponibilité</h3>
                    <p className="text-sm text-gray-700">
                      {dish.inventory.stock > 5
                        ? `En stock (${dish.inventory.stock} disponibles)`
                        : dish.inventory.stock > 0
                        ? `Stock limité (${dish.inventory.stock} restants)`
                        : 'Épuisé'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>Envie de ce plat ?</strong> Utilisez le bouton <strong>Scan&Pay</strong> en bas à droite pour déverrouiller le frigo et récupérer votre article instantanément.
              </p>
            </div>

            {dish.inventory && dish.inventory.stock === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-900 text-center font-semibold">
                  Rupture de stock
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
