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
      {navItems.map(({ to, label, icon: Icon }, idx) => (
        <Link
          key={to}
          to={to}
          className={cn(
            "bg-card border border-border rounded-lg p-2 sm:p-4 text-center hover:shadow-md hover:border-primary/30 transition-all active:scale-95 flex flex-col items-center gap-1 sm:gap-2 justify-center",
            idx === 4 && "col-span-2 sm:col-span-1"
          )}
        >
          <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
          <span className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">{label}</span>
        </Link>
      ))}
    </div>
  );
}