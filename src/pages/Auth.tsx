import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface AuthProps {
  onSuccess?: () => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else if (err.message?.includes('User already registered')) {
        setError('Cet email est déjà utilisé. Connectez-vous.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <img src="/folies-food-rvb_52.png" alt="Folies Fridge" className="w-40 h-40 object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Folies Fridge</h1>
          <p className="text-lg text-primary font-medium">Votre restauration à portée de clic</p>
        </div>

        <div className="bg-card rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isSignUp
              ? 'Rejoignez Folies Fridge pour profiter de vos avantages'
              : 'Accédez à votre compte fidélité et vos avantages'
            }
          </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none"
                required
                minLength={6}
              />
            </div>
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
          >
            {isLoading ? (isSignUp ? 'Création...' : 'Connexion...') : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
          </button>
        </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp
                ? 'Vous avez déjà un compte ? Connectez-vous'
                : 'Pas encore de compte ? Créez-en un'
              }
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
