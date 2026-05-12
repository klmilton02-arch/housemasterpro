export default function RewardProgress({ level }) {
  // Calculate XP for next level (example: 100 XP per level)
  const xpPerLevel = 100;
  const currentLevelXp = (level - 1) * xpPerLevel;
  const nextLevelXp = level * xpPerLevel;
  const progress = Math.min(100, ((level * xpPerLevel - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100);

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground font-medium">Level {level}</p>
        <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}