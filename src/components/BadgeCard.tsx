import { BadgeType, getColorClasses } from '../lib/badges';
import { Lock } from 'lucide-react';

interface BadgeCardProps {
  badge: BadgeType;
  isUnlocked: boolean;
  progress?: number;
  onClick?: () => void;
}

export function BadgeCard({ badge, isUnlocked, progress = 0, onClick }: BadgeCardProps) {
  const colors = getColorClasses(badge.color);
  const progressPercent = badge.requirement_value > 0
    ? Math.min((progress / badge.requirement_value) * 100, 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl p-4 transition-all ${
        isUnlocked
          ? `${colors.bg} border-2 ${colors.border} shadow-md hover:shadow-lg cursor-pointer transform hover:scale-105`
          : 'bg-gray-100 border-2 border-gray-300 opacity-60'
      }`}
    >
      {!isUnlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-gray-500" />
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <div className={`text-4xl mb-2 ${!isUnlocked ? 'grayscale' : ''}`}>
          {badge.icon}
        </div>

        <h3 className={`font-bold text-sm mb-1 ${isUnlocked ? colors.text : 'text-gray-600'}`}>
          {badge.name}
        </h3>

        <p className={`text-xs mb-2 ${isUnlocked ? 'text-gray-700' : 'text-gray-500'}`}>
          {badge.description}
        </p>

        {isUnlocked ? (
          <div className="flex items-center gap-1 text-xs font-medium">
            <span className={colors.text}>+{badge.xp_reward} XP</span>
          </div>
        ) : (
          <div className="w-full">
            <div className="w-full bg-gray-300 rounded-full h-1.5 mb-1">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">
              {progress} / {badge.requirement_value}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
