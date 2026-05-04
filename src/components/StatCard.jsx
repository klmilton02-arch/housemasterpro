import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, color, onClick, labelRight, smallLabel, labelOnTop }) {
  return (
    <div
      className={cn("bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4 transition-all", onClick && "cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-95")}
      onClick={onClick}
    >
      <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-7 h-7" />
      </div>
      {labelRight ? (
        <div className="min-w-0 flex items-center gap-3">
          <p className="text-base font-heading font-bold text-foreground">{value}</p>
          <p className={cn("font-medium text-muted-foreground", smallLabel ? "text-sm" : "text-sm")}>{label}</p>
        </div>
      ) : labelOnTop ? (
        <div className="min-w-0 flex flex-col items-start justify-center flex-1 text-left">
          <p className="text-sm text-muted-foreground leading-tight">{label}</p>
          <p className="text-base font-heading font-bold text-foreground leading-tight">{value}</p>
        </div>
      ) : (
        <div className="min-w-0">
          <p className="text-base font-heading font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      )}
    </div>
  );
}