import { Link } from "react-router-dom";
import { ListTodo, Layout, Users, Trophy, Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/presets", label: "Presets", icon: Layout },
  { to: "/family", label: "Family", icon: Users },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/home-setup", label: "Home Setup", icon: Home },
];

export default function QuickNav() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
      {navItems.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={cn(
            "bg-card border border-border rounded-lg p-3 sm:p-4 text-center hover:shadow-md hover:border-primary/30 transition-all active:scale-95 flex flex-col items-center gap-2"
          )}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <span className="text-xs font-medium text-foreground">{label}</span>
        </Link>
      ))}
    </div>
  );
}