const CURRENT_FRIDGE_KEY = 'foliesfridge_current_fridge';
const FAVORITE_FRIDGES_KEY = 'foliesfridge_favorite_fridges';

export const storage = {
  getCurrentFridge: (): string | null => {
    return localStorage.getItem(CURRENT_FRIDGE_KEY);
  },

  setCurrentFridge: (fridgeId: string): void => {
    localStorage.setItem(CURRENT_FRIDGE_KEY, fridgeId);
  },

  clearCurrentFridge: (): void => {
    localStorage.removeItem(CURRENT_FRIDGE_KEY);
  },

  getFavoriteFridges: (): string[] => {
    const favorites = localStorage.getItem(FAVORITE_FRIDGES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  },

  addFavoriteFridge: (fridgeId: string): void => {
    const favorites = storage.getFavoriteFridges();
    if (!favorites.includes(fridgeId)) {
      favorites.push(fridgeId);
      localStorage.setItem(FAVORITE_FRIDGES_KEY, JSON.stringify(favorites));
    }
  },

  removeFavoriteFridge: (fridgeId: string): void => {
    const favorites = storage.getFavoriteFridges();
    const filtered = favorites.filter(id => id !== fridgeId);
    localStorage.setItem(FAVORITE_FRIDGES_KEY, JSON.stringify(filtered));
  },
};
