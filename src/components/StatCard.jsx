import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div
      className={cn("bg-card border border-border rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-4 transition-all h-22", onClick && "cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-95")}
      onClick={onClick}
    >
      <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl sm:text-2xl font-heading font-bold text-foreground">{value}</p>
        <p className="text-sm sm:text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}