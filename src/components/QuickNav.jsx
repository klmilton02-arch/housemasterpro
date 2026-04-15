import { Link } from "react-router-dom";
import { ListTodo, Sparkles, Users, Trophy, Home } from "lucide-react";

const rows = [
  [
    { to: "/tasks", label: "Tasks", icon: ListTodo, cardClass: "bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600", textClass: "text-white", iconClass: "text-white" },
    { to: "/presets", label: "Presets", icon: Sparkles, cardClass: "bg-orange-400 border-orange-400 hover:bg-orange-500 hover:border-orange-500", textClass: "text-white", iconClass: "text-white" },
  ],
  [
    { to: "/family", label: "Family", icon: Users, cardClass: "bg-card border-border hover:border-primary/30", textClass: "text-foreground", iconClass: "text-primary" },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy, cardClass: "bg-slate-400 border-slate-400 hover:bg-slate-500 hover:border-slate-500", textClass: "text-white", iconClass: "text-white" },
  ],
  [
    { to: "/home-setup", label: "Home Setup", icon: Home, cardClass: "bg-black border-black hover:bg-gray-900 hover:border-gray-900", textClass: "text-white", iconClass: "text-white" },
  ],
];

export default function QuickNav() {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className={`grid gap-2 ${row.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {row.map(({ to, label, icon: Icon, cardClass, textClass, iconClass }) => (
            <Link
              key={to}
              to={to}
              className={`border rounded-lg p-3 text-center hover:shadow-md transition-all active:scale-95 flex flex-col items-center gap-1 justify-center ${cardClass}`}
            >
              <Icon className={`w-5 h-5 ${iconClass}`} />
              <span className={`text-xs font-medium ${textClass}`}>{label}</span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}