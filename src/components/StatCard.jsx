import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, color, onClick, labelRight, smallLabel, labelOnTop }) {
  return (
    <div
      className={cn("bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 sm:gap-4 transition-all", onClick && "cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-95")}
      onClick={onClick}
    >
      <div className={cn("w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-6 h-6" />
      </div>
      {labelRight ? (
        <div className="min-w-0 flex items-center gap-3">
          <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
          <p className={cn("font-medium text-muted-foreground", smallLabel ? "text-xs" : "text-base")}>{label}</p>
        </div>
      ) : labelOnTop ? (
        <div className="min-w-0 flex flex-col items-center justify-center flex-1">
          <p className="text-xs text-muted-foreground leading-tight">{label}</p>
          <p className="text-xl font-heading font-bold text-foreground leading-tight">{value}</p>
        </div>
      ) : (
        <div className="min-w-0">
          <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      )}
    </div>
  );
}