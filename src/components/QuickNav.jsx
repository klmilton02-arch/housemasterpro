import { Link } from "react-router-dom";
import { ListTodo, Sparkles, Users, Trophy, Home } from "lucide-react";

const rows = [
  [
    { to: "/tasks", label: "Tasks", icon: ListTodo, iconColor: "text-green-500" },
    { to: "/presets", label: "Presets", icon: Sparkles, iconColor: "text-orange-400" },
  ],
  [
    { to: "/family", label: "Family", icon: Users, iconColor: "text-primary" },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy, iconColor: "text-slate-400" },
  ],
  [
    { to: "/home-setup", label: "Home Setup", icon: Home, iconColor: "text-red-500" },
  ],
];

export default function QuickNav() {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className={`grid gap-2 ${row.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {row.map(({ to, label, icon: Icon, iconColor }) => (
            <Link
              key={to}
              to={to}
              className="bg-card border border-border rounded-lg p-3 text-center hover:shadow-md hover:border-primary/30 transition-all active:scale-95 flex flex-col items-center gap-1 justify-center"
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
              <span className="text-xs font-medium text-foreground">{label}</span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}