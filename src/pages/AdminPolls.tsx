import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { Plus, Trash2, Calendar, TrendingUp } from 'lucide-react';

interface Dish {
  id: string;
  name: string;
  category: string;
  image_url: string;
}

interface Poll {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  dish_1_id: string;
  dish_2_id: string;
  dish_3_id: string;
  status: 'active' | 'closed';
  created_at: string;
  dishes1?: Dish;
  dishes2?: Dish;
  dishes3?: Dish;
  vote_counts?: {
    dish_1: number;
    dish_2: number;
    dish_3: number;
  };
}

interface AdminPollsProps {
  onBack: () => void;
  onNavigateDishes: () => void;
  onNavigateNotifications: () => void;
}

export default function AdminPolls({ onBack, onNavigateDishes, onNavigateNotifications }: AdminPollsProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    end_date: '',
    dish_1_id: '',
    dish_2_id: '',
    dish_3_id: '',
  });

  const handleTabChange = (tab: 'dishes' | 'notifications' | 'polls') => {
    if (tab === 'dishes') onNavigateDishes();
    else if (tab === 'notifications') onNavigateNotifications();
  };

  useEffect(() => {
    loadPolls();
    loadDishes();
  }, []);

  const loadPolls = async () => {
    const { data, error } = await supabase
      .from('polls')
      .select(`
        *,
        dishes1:dishes!polls_dish_1_id_fkey(id, name, category, image_url),
        dishes2:dishes!polls_dish_2_id_fkey(id, name, category, image_url),
        dishes3:dishes!polls_dish_3_id_fkey(id, name, category, image_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading polls:', error);
      return;
    }

    const pollsWithVotes = await Promise.all(
      (data || []).map(async (poll) => {
        const { data: votes } = await supabase
          .from('poll_votes')
          .select('dish_id')
          .eq('poll_id', poll.id);

        const vote_counts = {
          dish_1: votes?.filter(v => v.dish_id === poll.dish_1_id).length || 0,
          dish_2: votes?.filter(v => v.dish_id === poll.dish_2_id).length || 0,
          dish_3: votes?.filter(v => v.dish_id === poll.dish_3_id).length || 0,
        };

        return { ...poll, vote_counts };
      })
    );

    setPolls(pollsWithVotes);
  };

  const loadDishes = async () => {
    const { data, error } = await supabase
      .from('dishes')
      .select('id, name, category, image_url')
      .order('name');

    if (!error && data) {
      setDishes(data);
    }
  };

  const createPoll = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.dish_1_id === formData.dish_2_id ||
        formData.dish_1_id === formData.dish_3_id ||
        formData.dish_2_id === formData.dish_3_id) {
      alert('Veuillez sélectionner 3 plats différents');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from('polls').insert({
      title: formData.title,
      end_date: formData.end_date,
      dish_1_id: formData.dish_1_id,
      dish_2_id: formData.dish_2_id,
      dish_3_id: formData.dish_3_id,
      status: 'active',
      created_by: userData.user.id,
    });

    if (error) {
      console.error('Error creating poll:', error);
      alert('Erreur lors de la création du sondage');
      return;
    }

    setFormData({
      title: '',
      end_date: '',
      dish_1_id: '',
      dish_2_id: '',
      dish_3_id: '',
    });
    setShowCreateForm(false);
    loadPolls();
  };

  const closePoll = async (pollId: string) => {
    const { error } = await supabase
      .from('polls')
      .update({ status: 'closed' })
      .eq('id', pollId);

    if (!error) {
      loadPolls();
    }
  };

  const deletePoll = async (pollId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce sondage ?')) return;

    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (!error) {
      loadPolls();
    }
  };

  const getWinningDish = (poll: Poll) => {
    if (!poll.vote_counts) return null;

    const votes = [
      { dish: poll.dishes1, count: poll.vote_counts.dish_1 },
      { dish: poll.dishes2, count: poll.vote_counts.dish_2 },
      { dish: poll.dishes3, count: poll.vote_counts.dish_3 },
    ];

    return votes.sort((a, b) => b.count - a.count)[0];
  };

  return (
    <AdminLayout activeTab="polls" onBack={onBack} onTabChange={handleTabChange}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sondages Hebdomadaires</h1>
          <p className="text-gray-600 mt-2">Créez un sondage pour élire le plat de la semaine</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau Sondage
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Créer un Sondage</h2>
            <form onSubmit={createPoll} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du sondage
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Plat de la semaine du..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plat 1
                  </label>
                  <select
                    required
                    value={formData.dish_1_id}
                    onChange={(e) => setFormData({ ...formData, dish_1_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un plat</option>
                    {dishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name} ({dish.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plat 2
                  </label>
                  <select
                    required
                    value={formData.dish_2_id}
                    onChange={(e) => setFormData({ ...formData, dish_2_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un plat</option>
                    {dishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name} ({dish.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plat 3
                  </label>
                  <select
                    required
                    value={formData.dish_3_id}
                    onChange={(e) => setFormData({ ...formData, dish_3_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un plat</option>
                    {dishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name} ({dish.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Créer le Sondage
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {polls.map((poll) => {
          const winner = getWinningDish(poll);
          const totalVotes = (poll.vote_counts?.dish_1 || 0) +
                           (poll.vote_counts?.dish_2 || 0) +
                           (poll.vote_counts?.dish_3 || 0);

          return (
            <div key={poll.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{poll.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        poll.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {poll.status === 'active' ? 'En cours' : 'Terminé'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Fin : {new Date(poll.end_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {poll.status === 'active' && (
                    <button
                      onClick={() => closePoll(poll.id)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Clôturer
                    </button>
                  )}
                  <button
                    onClick={() => deletePoll(poll.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { dish: poll.dishes1, count: poll.vote_counts?.dish_1 || 0 },
                  { dish: poll.dishes2, count: poll.vote_counts?.dish_2 || 0 },
                  { dish: poll.dishes3, count: poll.vote_counts?.dish_3 || 0 },
                ].map((item, idx) => {
                  const percentage = totalVotes > 0 ? (item.count / totalVotes) * 100 : 0;
                  const isWinner = poll.status === 'closed' && winner?.dish?.id === item.dish?.id;

                  return (
                    <div
                      key={idx}
                      className={`border-2 rounded-lg p-4 ${
                        isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      {isWinner && (
                        <div className="flex items-center gap-1 text-green-600 font-medium mb-2">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm">Gagnant!</span>
                        </div>
                      )}
                      <img
                        src={item.dish?.image_url}
                        alt={item.dish?.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h4 className="font-semibold text-gray-900 mb-2">{item.dish?.name}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Votes</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isWinner ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-sm text-gray-600 text-center">
                          {percentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalVotes > 0 && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  Total : {totalVotes} vote{totalVotes > 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        })}

        {polls.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun sondage
            </h3>
            <p className="text-gray-600">
              Créez votre premier sondage hebdomadaire
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
