export default function BurstTimer({ timeLeft, duration }) {
  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  
  // Green (0%) -> Yellow (50%) -> Red (100%)
  let barColor = "bg-green-500";
  if (progress > 75) barColor = "bg-red-500";
  else if (progress > 50) barColor = "bg-orange-500";
  else if (progress > 25) barColor = "bg-yellow-500";

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div>
      <div className="text-center mb-4">
        <p className="font-heading text-5xl font-bold text-foreground">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      </div>
      <div className="h-6 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300 flex items-center justify-center`}
          style={{ width: `${progress}%` }}
        >
          {progress > 10 && (
            <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
          )}
        </div>
      </div>
    </div>
  );
}