import { Flame } from "lucide-react";

export default function StreakCircle({ streak = 0, size = "md" }) {
  const sizeMap = {
    sm: { container: "w-16 h-16", circle: "w-16 h-16", flame: "w-5 h-5", text: "text-lg", label: "text-xs" },
    md: { container: "w-20 h-20", circle: "w-20 h-20", flame: "w-6 h-6", text: "text-2xl", label: "text-sm" },
    lg: { container: "w-28 h-28", circle: "w-28 h-28", flame: "w-8 h-8", text: "text-4xl", label: "text-base" },
  };

  const s = sizeMap[size];
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (streak / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-2`}>
      <div className={`relative ${s.container} flex items-center justify-center`}>
        <svg
          className={`absolute ${s.circle} -rotate-90`}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-red-500 transition-all duration-300"
          />
        </svg>
        <div className="flex flex-col items-center">
          <Flame className={`${s.flame} text-red-500 fill-red-500`} />
          <p className={`font-heading font-bold text-foreground ${s.text}`}>{streak}</p>
        </div>
      </div>
      <p className={`text-muted-foreground font-medium ${s.label}`}>Day Streak</p>
    </div>
  );
}