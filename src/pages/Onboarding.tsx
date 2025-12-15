import { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { supabase, Database } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';

type Fridge = Database['fridges'];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentFridge } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from('fridges')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('status', 'active')
        .maybeSingle();

      if (queryError) throw queryError;

      if (!data) {
        setError('Code frigo introuvable ou inactif. Vérifiez le code affiché sur la porte.');
        return;
      }

      setCurrentFridge(data as Fridge);
      onComplete();
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/folies-food-rvb_52.png" alt="Folies Fridge" className="w-40 h-40 object-contain mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Folies Fridge</h1>
          <p className="text-lg text-gray-600">Votre frigo connecté</p>
        </div>

        <div className="bg-card rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue</h2>
          <p className="text-gray-600 mb-6">
            Entrez le code affiché sur votre frigo pour découvrir les plats disponibles
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                Code frigo
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: FF-001"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none text-lg font-medium uppercase"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Recherche...' : 'Découvrir ce frigo'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Codes de démonstration : <br />
              <span className="font-semibold text-primary">FF-001</span>,{' '}
              <span className="font-semibold text-primary">FF-002</span>,{' '}
              <span className="font-semibold text-primary">FF-003</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
