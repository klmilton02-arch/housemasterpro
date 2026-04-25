import { Link } from "react-router-dom";
import { ListTodo, Zap, Trophy, Sparkles, Users, Home, Calendar, User } from "lucide-react";

const items = [
  { to: "/tasks", label: "Tasks", icon: ListTodo, cardClass: "bg-blue-400 border-blue-400 hover:bg-blue-500 hover:border-blue-500", textClass: "text-white", iconClass: "text-white" },
  { to: "/burst", label: "Blast Mode", icon: Zap, cardClass: "bg-blue-400 border-blue-400 hover:bg-blue-500 hover:border-blue-500", textClass: "text-white", iconClass: "text-white" },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy, cardClass: "bg-blue-400 border-blue-400 hover:bg-blue-500 hover:border-blue-500", textClass: "text-white", iconClass: "text-white" },
  { to: "/presets", label: "Presets", icon: Sparkles, cardClass: "bg-blue-400 border-blue-400 hover:bg-blue-500 hover:border-blue-500", textClass: "text-white", iconClass: "text-white" },
  { to: "/family", label: "Family", icon: Users, cardClass: "bg-blue-400 border-blue-400 hover:bg-blue-500 hover:border-blue-500", textClass: "text-white", iconClass: "text-white" },
  { to: "/home-setup", label: "Home Setup", icon: Home, cardClass: "bg-blue-400 border-blue-400 hover:bg-blue-500 hover:border-blue-500", textClass: "text-white", iconClass: "text-white" },
  { to: "/tasks", label: "Calendar", icon: Calendar, cardClass: "bg-blue-400 border-blue-400 hover:bg-blue-500 hover:border-blue-500", textClass: "text-white", iconClass: "text-white" },
  { to: "/profile", label: "Profile", icon: User, cardClass: "bg-blue-400 border-blue-400 hover:bg-blue-500 hover:border-blue-500", textClass: "text-white", iconClass: "text-white" },
];

export default function QuickNav() {
  return (
    <div className="space-y-2">
      {items.map(({ to, label, icon: Icon, cardClass, textClass, iconClass }) => (
        <Link
          key={to}
          to={to}
          className={`border rounded-lg px-3 hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 h-14 text-lg ${cardClass}`}
        >
          <Icon className={`w-5 h-5 ${iconClass}`} />
          <span className={`font-medium ${textClass}`}>{label}</span>
        </Link>
      ))}
    </div>
  );
}