import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, color, onClick, labelRight, smallLabel, labelOnTop, large, bigText }) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl flex items-center transition-all h-full",
        large ? "px-4 py-3 gap-4" : "px-3 py-2 gap-3",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-95"
      )}
      onClick={onClick}
    >
      <div className={cn("rounded-lg flex items-center justify-center flex-shrink-0", color, large ? "w-12 h-12" : "w-9 h-9")}>
        <Icon className={large ? "w-6 h-6" : "w-4 h-4"} />
      </div>
      {labelRight ? (
        <div className="min-w-0 flex items-center gap-2 w-full">
          <p className={`font-heading font-bold text-foreground leading-snug text-left break-words ${bigText ? "text-base" : "text-xs"}`}>{value}</p>
          {label ? <p className={`font-medium text-foreground/70 leading-snug text-left break-words ${bigText ? "text-base" : "text-xs"}`}>{label}</p> : null}
        </div>
      ) : labelOnTop ? (
        <div className="min-w-0 flex flex-col items-start justify-center flex-1 text-left">
          <p className={cn("text-foreground/70 leading-tight text-left", large ? "text-lg" : "text-base")}>{label}</p>
          <p className={cn("font-heading font-bold text-foreground leading-tight text-left", large ? "text-2xl" : "text-lg")}>{value}</p>
        </div>
      ) : value ? (
        <div className="min-w-0 flex flex-col items-start justify-center flex-1">
          <p className={cn("font-heading font-bold text-foreground text-left", large ? "text-2xl" : "text-lg")}>{value}</p>
          <p className={cn("font-heading font-medium text-foreground/70 text-left truncate w-full", large ? "text-base" : "text-sm")}>{label}</p>
        </div>
      ) : (
        <div className="min-w-0 flex items-center flex-1 overflow-hidden">
          <p className={cn("font-heading font-medium text-foreground/80 text-left truncate", large ? "text-base" : "text-sm")}>{label}</p>
        </div>
      )}
    </div>
  );
}