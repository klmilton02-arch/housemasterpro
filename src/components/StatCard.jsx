import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div
      className={cn("bg-card border border-border rounded-xl p-4 flex items-center gap-4 transition-all", onClick && "cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-95")}
      onClick={onClick}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}