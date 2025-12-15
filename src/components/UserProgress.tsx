import { useState } from 'react';
import { UserStats, getXPForNextLevel, convertXPToLoyaltyPoints, getXPConversionRate } from '../lib/badges';
import { TrendingUp, Award, Flame, ArrowRightLeft, Sparkles } from 'lucide-react';

interface UserProgressProps {
  stats: UserStats;
  badgeCount: number;
  loyaltyPoints: number;
  onUpdate: () => void;
}

export function UserProgress({ stats, badgeCount, loyaltyPoints, onUpdate }: UserProgressProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [showConversion, setShowConversion] = useState(false);
  const [xpToConvert, setXpToConvert] = useState(100);
  const xpForNext = getXPForNextLevel(stats.level);
  const currentLevelXP = getXPForNextLevel(stats.level - 1);
  const xpInCurrentLevel = stats.total_xp - currentLevelXP;
  const xpNeededForLevel = xpForNext - currentLevelXP;
  const progressPercent = (xpInCurrentLevel / xpNeededForLevel) * 100;

  const conversionRate = getXPConversionRate();
  const convertedPoints = Math.floor(xpToConvert / conversionRate);
  const maxConvertible = Math.floor(stats.total_xp / 100) * 100;

  const handleConvert = async () => {
    if (xpToConvert < 100 || xpToConvert > stats.total_xp) return;

    setIsConverting(true);
    const success = await convertXPToLoyaltyPoints(stats.user_id, xpToConvert);

    if (success) {
      setShowConversion(false);
      setXpToConvert(100);
      onUpdate();
    }
    setIsConverting(false);
  };

  return (
    <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Niveau {stats.level}</h2>
          <p className="text-orange-100 text-sm">
            {xpInCurrentLevel} / {xpNeededForLevel} XP
          </p>
        </div>
        <div className="bg-white bg-opacity-20 rounded-full p-3">
          <TrendingUp className="w-8 h-8" />
        </div>
      </div>

      <div className="w-full bg-orange-300 bg-opacity-30 rounded-full h-3 mb-6">
        <div
          className="bg-white h-3 rounded-full transition-all shadow-sm"
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-xs text-orange-100">Badges</span>
          </div>
          <p className="text-2xl font-bold">{badgeCount}</p>
        </div>

        <div className="bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-xs text-orange-100">Série</span>
          </div>
          <p className="text-2xl font-bold">{stats.current_streak}</p>
        </div>

        <div className="bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs text-orange-100">XP Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.total_xp}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white border-opacity-20">
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-orange-100">Commandes</p>
            <p className="font-semibold">{stats.total_orders}</p>
          </div>
          <div>
            <p className="text-orange-100">Dépensé</p>
            <p className="font-semibold">{Number(stats.total_spent).toFixed(2)}€</p>
          </div>
        </div>

        {!showConversion ? (
          <button
            onClick={() => setShowConversion(true)}
            disabled={stats.total_xp < 100}
            className="w-full bg-white text-orange-600 font-semibold py-3 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Convertir XP en Points
          </button>
        ) : (
          <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Conversion XP → Points</h4>
              <button
                onClick={() => setShowConversion(false)}
                className="text-white hover:text-orange-100"
              >
                ✕
              </button>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-orange-100">XP à convertir:</span>
                <span className="font-bold">{xpToConvert} XP</span>
              </div>
              <input
                type="range"
                min="100"
                max={maxConvertible}
                step="100"
                value={xpToConvert}
                onChange={(e) => setXpToConvert(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="font-bold">{xpToConvert} XP</span>
                <ArrowRightLeft className="w-4 h-4" />
                <span className="font-bold">{convertedPoints} Points</span>
              </div>
              <p className="text-xs text-center text-orange-100 mt-1">
                Taux: {conversionRate} XP = 1 Point
              </p>
            </div>

            <button
              onClick={handleConvert}
              disabled={isConverting || xpToConvert < 100}
              className="w-full bg-white text-orange-600 font-semibold py-3 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isConverting ? (
                <>Conversion...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Convertir maintenant
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
