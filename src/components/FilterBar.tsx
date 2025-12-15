import { Filter } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedLabels: string[];
  onLabelToggle: (label: string) => void;
}

const categories = [
  { value: 'all', label: 'Tout' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'snack', label: 'Snack' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drinks', label: 'Boissons' },
];

const labels = [
  { value: 'végétarien', label: 'Végétarien' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'sans gluten', label: 'Sans gluten' },
];

export function FilterBar({
  selectedCategory,
  onCategoryChange,
  selectedLabels,
  onLabelToggle,
}: FilterBarProps) {
  return (
    <div className="bg-background border-b border-gray-200 sticky top-[73px] z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filtres</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto mt-2 scrollbar-hide">
          {labels.map((label) => (
            <button
              key={label.value}
              onClick={() => onLabelToggle(label.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedLabels.includes(label.value)
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              {label.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
