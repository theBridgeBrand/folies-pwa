import { supabase } from './supabase';

export interface BadgeType {
  id: string;
  name: string;
  description: string;
  category: 'orders' | 'spending' | 'streak' | 'voting' | 'special';
  level: number;
  icon: string;
  xp_reward: number;
  requirement_value: number;
  color: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type_id: string;
  unlocked_at: string;
  progress: number;
  badge_types?: BadgeType;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  total_orders: number;
  total_spent: number;
  current_streak: number;
  longest_streak: number;
  last_order_date: string | null;
  polls_voted: number;
}

export async function initializeUserStats(userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('user_stats')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('user_stats').insert({
      user_id: userId,
      total_xp: 0,
      level: 1,
      total_orders: 0,
      total_spent: 0,
      current_streak: 0,
      longest_streak: 0,
      polls_voted: 0,
    });
  }
}

export async function checkAndUnlockBadges(userId: string): Promise<UserBadge[]> {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!stats) return [];

  const { data: allBadges } = await supabase
    .from('badge_types')
    .select('*');

  if (!allBadges) return [];

  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_type_id')
    .eq('user_id', userId);

  const unlockedBadgeIds = new Set(userBadges?.map(b => b.badge_type_id) || []);
  const newlyUnlocked: UserBadge[] = [];

  for (const badge of allBadges) {
    if (unlockedBadgeIds.has(badge.id)) continue;

    let shouldUnlock = false;

    switch (badge.category) {
      case 'orders':
        shouldUnlock = stats.total_orders >= badge.requirement_value;
        break;
      case 'spending':
        shouldUnlock = Number(stats.total_spent) >= badge.requirement_value;
        break;
      case 'streak':
        shouldUnlock = stats.longest_streak >= badge.requirement_value;
        break;
      case 'voting':
        shouldUnlock = stats.polls_voted >= badge.requirement_value;
        break;
      case 'special':
        if (badge.name === 'Collectionneur') {
          shouldUnlock = userBadges && userBadges.length >= badge.requirement_value;
        }
        break;
    }

    if (shouldUnlock) {
      const { data: newBadge, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_type_id: badge.id,
          progress: 0,
        })
        .select('*, badge_types(*)')
        .single();

      if (!error && newBadge) {
        await supabase
          .from('user_stats')
          .update({
            total_xp: stats.total_xp + badge.xp_reward,
          })
          .eq('user_id', userId);

        newlyUnlocked.push(newBadge as any);
      }
    }
  }

  return newlyUnlocked;
}

export async function updateOrderStats(userId: string, orderAmount: number): Promise<void> {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!stats) {
    await initializeUserStats(userId);
    await updateOrderStats(userId, orderAmount);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const lastOrderDate = stats.last_order_date;

  let newStreak = 1;
  if (lastOrderDate) {
    const lastDate = new Date(lastOrderDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = stats.current_streak + 1;
    } else if (diffDays === 0) {
      newStreak = stats.current_streak;
    }
  }

  const newLongestStreak = Math.max(newStreak, stats.longest_streak);

  await supabase
    .from('user_stats')
    .update({
      total_orders: stats.total_orders + 1,
      total_spent: Number(stats.total_spent) + orderAmount,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_order_date: today,
    })
    .eq('user_id', userId);

  await checkAndUnlockBadges(userId);
}

export async function updatePollVoteStats(userId: string): Promise<void> {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!stats) {
    await initializeUserStats(userId);
    return;
  }

  await supabase
    .from('user_stats')
    .update({
      polls_voted: stats.polls_voted + 1,
    })
    .eq('user_id', userId);

  await checkAndUnlockBadges(userId);
}

export function getColorClasses(color: string): { bg: string; text: string; border: string } {
  switch (color) {
    case 'bronze':
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-400' };
    case 'silver':
      return { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-400' };
    case 'gold':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400' };
    case 'platinum':
      return { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-400' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
  }
}

export function getXPForNextLevel(currentLevel: number): number {
  return Math.pow((currentLevel), 2) * 100;
}

export async function convertXPToLoyaltyPoints(userId: string, xpAmount: number): Promise<boolean> {
  if (xpAmount < 100) return false;

  const loyaltyPoints = Math.floor(xpAmount / 10);

  const { data: stats } = await supabase
    .from('user_stats')
    .select('total_xp')
    .eq('user_id', userId)
    .single();

  if (!stats || stats.total_xp < xpAmount) return false;

  const { error: statsError } = await supabase
    .from('user_stats')
    .update({
      total_xp: stats.total_xp - xpAmount,
    })
    .eq('user_id', userId);

  if (statsError) return false;

  const { data: userProfile } = await supabase
    .from('users')
    .select('loyalty_points')
    .eq('id', userId)
    .single();

  if (!userProfile) return false;

  const { error: userError } = await supabase
    .from('users')
    .update({
      loyalty_points: userProfile.loyalty_points + loyaltyPoints,
    })
    .eq('id', userId);

  return !userError;
}

export function getXPConversionRate(): number {
  return 10;
}

export function getLevelUpReward(level: number): number {
  return level * 50;
}
