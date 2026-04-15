export default function BurstTimer({ timeLeft, duration }) {
  const totalSeconds = duration * 60;
  const progress = (totalSeconds - timeLeft) / totalSeconds; // 0 to 1

  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  let strokeColor = "#22c55e"; // green
  if (progress > 0.75) strokeColor = "#ef4444"; // red
  else if (progress > 0.5) strokeColor = "#f97316"; // orange
  else if (progress > 0.25) strokeColor = "#eab308"; // yellow

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
        />
      </svg>
      {/* Time label overlaid in center */}
      <div className="font-heading text-4xl font-bold text-foreground -mt-[116px] mb-[76px]">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
    </div>
  );
}