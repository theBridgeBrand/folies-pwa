import { useState, useEffect } from 'react';
import { supabase, Database } from '../lib/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';

type Dish = Database['dishes'];

interface AdminDishesProps {
  onBack: () => void;
  onNavigateNotifications: () => void;
  onNavigatePolls: () => void;
}

export function AdminDishes({ onBack, onNavigateNotifications, onNavigatePolls }: AdminDishesProps) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleTabChange = (tab: 'dishes' | 'notifications' | 'polls') => {
    if (tab === 'notifications') onNavigateNotifications();
    else if (tab === 'polls') onNavigatePolls();
  };

  useEffect(() => {
    loadDishes();
  }, []);

  const loadDishes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('name');

      if (error) throw error;
      setDishes(data as Dish[]);
    } catch (err) {
      console.error('Error loading dishes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingDish({
      id: '',
      name: '',
      description: '',
      price: 0,
      category: 'lunch',
      image_url: '',
      allergens: [],
      labels: [],
      nutritional_info: {},
      is_bestseller: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  const handleSave = async () => {
    if (!editingDish) return;

    try {
      if (isCreating) {
        const { error } = await supabase
          .from('dishes')
          .insert({
            name: editingDish.name,
            description: editingDish.description,
            price: editingDish.price,
            category: editingDish.category,
            image_url: editingDish.image_url,
            allergens: editingDish.allergens,
            labels: editingDish.labels,
            nutritional_info: editingDish.nutritional_info,
            is_bestseller: editingDish.is_bestseller,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dishes')
          .update({
            name: editingDish.name,
            description: editingDish.description,
            price: editingDish.price,
            category: editingDish.category,
            image_url: editingDish.image_url,
            allergens: editingDish.allergens,
            labels: editingDish.labels,
            nutritional_info: editingDish.nutritional_info,
            is_bestseller: editingDish.is_bestseller,
          })
          .eq('id', editingDish.id);

        if (error) throw error;
      }

      setEditingDish(null);
      setIsCreating(false);
      loadDishes();
    } catch (err) {
      console.error('Error saving dish:', err);
      alert('Erreur lors de la sauvegarde du plat');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) return;

    try {
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadDishes();
    } catch (err) {
      console.error('Error deleting dish:', err);
      alert('Erreur lors de la suppression du plat');
    }
  };

  const handleCancel = () => {
    setEditingDish(null);
    setIsCreating(false);
  };

  return (
    <AdminLayout activeTab="dishes" onBack={onBack} onTabChange={handleTabChange}>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestion des plats</h2>
          {!editingDish && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouveau plat
            </button>
          )}
        </div>

        {editingDish && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {isCreating ? 'Nouveau plat' : 'Modifier le plat'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du plat
                </label>
                <input
                  type="text"
                  value={editingDish.name}
                  onChange={(e) =>
                    setEditingDish({ ...editingDish, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingDish.price}
                  onChange={(e) =>
                    setEditingDish({ ...editingDish, price: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={editingDish.category}
                  onChange={(e) =>
                    setEditingDish({ ...editingDish, category: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="breakfast">Petit-déjeuner</option>
                  <option value="lunch">Déjeuner</option>
                  <option value="snack">Snack</option>
                  <option value="dinner">Dîner</option>
                  <option value="dessert">Dessert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de l'image
                </label>
                <input
                  type="text"
                  value={editingDish.image_url}
                  onChange={(e) =>
                    setEditingDish({ ...editingDish, image_url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingDish.description}
                  onChange={(e) =>
                    setEditingDish({ ...editingDish, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Labels (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={editingDish.labels?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingDish({
                      ...editingDish,
                      labels: e.target.value.split(',').map((l) => l.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="vegetarian, bio, local"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergènes (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={editingDish.allergens?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingDish({
                      ...editingDish,
                      allergens: e.target.value.split(',').map((a) => a.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="gluten, lactose"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingDish.is_bestseller}
                    onChange={(e) =>
                      setEditingDish({ ...editingDish, is_bestseller: e.target.checked })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Marquer comme best-seller
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Nom</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Catégorie</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Prix</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Labels</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((dish) => (
                  <tr key={dish.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {dish.image_url && (
                          <img
                            src={dish.image_url}
                            alt={dish.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{dish.name}</div>
                          <div className="text-sm text-gray-500">{dish.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {getCategoryLabel(dish.category)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{dish.price}€</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {dish.labels?.map((label) => (
                          <span
                            key={label}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingDish(dish)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dish.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    snack: 'Snack',
    dinner: 'Dîner',
    dessert: 'Dessert',
  };
  return labels[category] || category;
}
