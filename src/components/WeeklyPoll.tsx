import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useBadges } from '../contexts/BadgeContext';
import { updatePollVoteStats, checkAndUnlockBadges } from '../lib/badges';
import { TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface Dish {
  id: string;
  name: string;
  image_url: string;
}

interface Poll {
  id: string;
  title: string;
  end_date: string;
  dish_1_id: string;
  dish_2_id: string;
  dish_3_id: string;
  dishes1?: Dish;
  dishes2?: Dish;
  dishes3?: Dish;
}

interface PollVote {
  dish_id: string;
}

export function WeeklyPoll() {
  const { showBadgeNotification } = useBadges();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    loadActivePoll();
  }, []);

  const loadActivePoll = async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('polls')
      .select(`
        *,
        dishes1:dishes!polls_dish_1_id_fkey(id, name, image_url),
        dishes2:dishes!polls_dish_2_id_fkey(id, name, image_url),
        dishes3:dishes!polls_dish_3_id_fkey(id, name, image_url)
      `)
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return;
    }

    setPoll(data);

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: voteData } = await supabase
        .from('poll_votes')
        .select('dish_id')
        .eq('poll_id', data.id)
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (voteData) {
        setUserVote(voteData.dish_id);
      }
    }

    const { data: votes } = await supabase
      .from('poll_votes')
      .select('dish_id')
      .eq('poll_id', data.id);

    const counts: Record<string, number> = {};
    votes?.forEach((vote: PollVote) => {
      counts[vote.dish_id] = (counts[vote.dish_id] || 0) + 1;
    });
    setVoteCounts(counts);
  };

  const handleVote = async (dishId: string) => {
    if (!poll || isVoting) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    setIsVoting(true);

    try {
      const isFirstVote = !userVote;

      if (userVote) {
        await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', poll.id)
          .eq('user_id', userData.user.id);
      }

      const { error } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: poll.id,
          user_id: userData.user.id,
          dish_id: dishId,
        });

      if (!error) {
        if (isFirstVote) {
          await updatePollVoteStats(userData.user.id);
          const newBadges = await checkAndUnlockBadges(userData.user.id);

          newBadges.forEach((badge) => {
            if (badge.badge_types) {
              showBadgeNotification(badge.badge_types as any);
            }
          });
        }

        setUserVote(dishId);
        loadActivePoll();
      }
    } catch (err) {
      console.error('Error voting:', err);
    } finally {
      setIsVoting(false);
    }
  };

  if (!poll) return null;

  const dishes = [
    { ...poll.dishes1!, id: poll.dish_1_id },
    { ...poll.dishes2!, id: poll.dish_2_id },
    { ...poll.dishes3!, id: poll.dish_3_id },
  ];

  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
  const timeLeft = getTimeLeft(poll.end_date);

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 mb-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900">{poll.title}</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{timeLeft}</span>
        </div>
      </div>

      <p className="text-gray-700 mb-4">
        Votez pour votre plat préféré de la semaine !
      </p>

      <div className="grid grid-cols-3 gap-4">
        {dishes.map((dish) => {
          const votes = voteCounts[dish.id] || 0;
          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          const hasVoted = userVote === dish.id;

          return (
            <button
              key={dish.id}
              onClick={() => handleVote(dish.id)}
              disabled={isVoting}
              className={`relative bg-white rounded-xl p-4 transition-all ${
                hasVoted
                  ? 'ring-2 ring-orange-500 shadow-lg'
                  : 'hover:shadow-lg hover:scale-105'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {hasVoted && (
                <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
              <img
                src={dish.image_url}
                alt={dish.name}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                {dish.name}
              </h3>
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {votes} vote{votes !== 1 ? 's' : ''} ({percentage.toFixed(0)}%)
                </div>
              </div>
            </button>
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
}

function getTimeLeft(endDate: string): string {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return 'Terminé';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} jour${diffDays > 1 ? 's' : ''} restant${diffDays > 1 ? 's' : ''}`;
  if (diffHours > 0) return `${diffHours}h restantes`;

  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `${diffMins}min restantes`;
}
