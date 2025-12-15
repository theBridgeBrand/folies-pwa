import { useState, useEffect } from 'react';
import { supabase, Database } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import { FilterBar } from '../components/FilterBar';
import { DishCard } from '../components/DishCard';
import { WeeklyPoll } from '../components/WeeklyPoll';
import { RefreshCw, MapPin, Clock } from 'lucide-react';

type Dish = Database['dishes'];
type Inventory = Database['fridge_inventory'];

interface DishWithInventory extends Dish {
  inventory: Inventory;
}

interface HomeProps {
  onDishClick: (dish: DishWithInventory) => void;
  onChangeFridge: () => void;
}

export function Home({ onDishClick, onChangeFridge }: HomeProps) {
  const { currentFridge } = useApp();
  const [dishes, setDishes] = useState<DishWithInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  useEffect(() => {
    if (currentFridge) {
      loadDishes();
    }
  }, [currentFridge]);

  const loadDishes = async () => {
    if (!currentFridge) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fridge_inventory')
        .select(`
          *,
          dishes (*)
        `)
        .eq('fridge_id', currentFridge.id)
        .gt('stock', 0)
        .order('display_order');

      if (error) throw error;

      const dishesWithInventory = data
        .filter((item: any) => item.dishes)
        .map((item: any) => ({
          ...item.dishes,
          inventory: {
            id: item.id,
            fridge_id: item.fridge_id,
            dish_id: item.dish_id,
            stock: item.stock,
            promotion_price: item.promotion_price,
            is_new: item.is_new,
            display_order: item.display_order,
            updated_at: item.updated_at,
          },
        }));

      setDishes(dishesWithInventory);
    } catch (err) {
      console.error('Error loading dishes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDishes = dishes.filter((dish) => {
    if (selectedCategory !== 'all' && dish.category !== selectedCategory) {
      return false;
    }

    if (selectedLabels.length > 0) {
      const hasAllLabels = selectedLabels.every((label) =>
        dish.labels?.includes(label)
      );
      if (!hasAllLabels) return false;
    }

    return true;
  });

  const handleLabelToggle = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  if (!currentFridge) {
    return null;
  }

  const lastRestocked = new Date(currentFridge.last_restocked);
  const timeAgo = formatTimeAgo(lastRestocked);

  return (
    <div className="min-h-screen bg-background">
      <FilterBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedLabels={selectedLabels}
        onLabelToggle={handleLabelToggle}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-card rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {currentFridge.name}
              </h2>
              <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                <MapPin className="w-4 h-4" />
                {currentFridge.location}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Dernier réassort : {timeAgo}
              </p>
            </div>
            <button
              onClick={onChangeFridge}
              className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary-50 rounded-lg transition-colors"
            >
              Changer
            </button>
          </div>
        </div>

        <WeeklyPoll />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredDishes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">
              Aucun plat disponible avec ces filtres
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                inventory={dish.inventory}
                onClick={() => onDishClick(dish)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  if (diffHours > 0) return `il y a ${diffHours}h`;
  if (diffMins > 0) return `il y a ${diffMins}min`;
  return `à l'instant`;
}
