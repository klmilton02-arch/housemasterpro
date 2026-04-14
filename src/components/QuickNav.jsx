import { Link } from "react-router-dom";
import { ListTodo, Layout, Users, Trophy, Home, AlertTriangle } from "lucide-react";
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
    <div className="grid grid-cols-5 gap-2">
      {navItems.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="bg-card border border-border rounded-lg p-2 text-center hover:shadow-md hover:border-primary/30 transition-all active:scale-95 flex flex-col items-center gap-1 justify-center"
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <span className="text-xs font-medium text-foreground line-clamp-1">{label}</span>
        </Link>
      ))}
    </div>
  );
}