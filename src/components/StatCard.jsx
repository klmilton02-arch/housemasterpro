import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, color, onClick, labelRight, smallLabel, labelOnTop, large }) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl flex items-center transition-all h-full",
        large ? "px-4 py-4 gap-4" : "px-3 py-2.5 gap-3",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-95"
      )}
      onClick={onClick}
    >
      <div className={cn("rounded-lg flex items-center justify-center flex-shrink-0", color, large ? "w-16 h-16" : "w-11 h-11")}>
        <Icon className={large ? "w-8 h-8" : "w-5 h-5"} />
      </div>
      {labelRight ? (
        <div className="min-w-0 flex items-center gap-3">
          <p className={cn("font-heading font-bold text-foreground", large ? "text-xl" : "text-lg")}>{value}</p>
          <p className={cn("font-medium text-muted-foreground", large ? "text-base" : "text-base")}>{label}</p>
        </div>
      ) : labelOnTop ? (
        <div className="min-w-0 flex flex-col items-start justify-center flex-1 text-left">
          <p className={cn("text-muted-foreground leading-tight", large ? "text-base" : "text-sm")}>{label}</p>
          <p className={cn("font-heading font-bold text-foreground leading-tight", large ? "text-xl" : "text-base")}>{value}</p>
        </div>
      ) : (
        <div className="min-w-0">
          <p className={cn("font-heading font-bold text-foreground", large ? "text-xl" : "text-sm")}>{value}</p>
          <p className={cn("font-heading font-bold text-muted-foreground", large ? "text-base" : "text-sm")}>{label}</p>
        </div>
      )}
    </div>
  );
}