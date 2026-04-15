import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListChecks, Sparkles, Users, Trophy, Home, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import MobileHeader from "./MobileHeader";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tasks", label: "Tasks", icon: ListChecks },
  { path: "/burst", label: "Burst", icon: Zap },
  { path: "/presets", label: "Presets", icon: Sparkles },
  { path: "/family", label: "People", icon: Users },
  { path: "/leaderboard", label: "Scores", icon: Trophy },
  { path: "/home-setup", label: "Setup", icon: Home },
];

const rootPaths = ["/", "/tasks", "/burst", "/presets", "/family", "/leaderboard", "/home-setup"];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRootPath = rootPaths.includes(location.pathname);
  const currentNav = navItems.find(n => location.pathname.startsWith(n.path === "/" ? "/" : n.path)) || navItems[0];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-border" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">HomeLifeFocus</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Family Task Manager</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all select-none",
                location.pathname === path
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <Link
            to="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all select-none",
              location.pathname === "/profile"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <User className="w-4 h-4" />
            Profile
          </Link>
        </div>
      </aside>



      <MobileHeader />

      {/* Main content */}
      <main className="flex-1 md:ml-64 md:pt-0 md:pb-8" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top))', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <div className="w-full max-w-sm md:max-w-4xl mx-auto md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={e => {
                if (isActive) {
                  e.preventDefault();
                  if (location.pathname !== path) {
                    navigate(path, { replace: true });
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }
              }}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-4 gap-0.5 select-none transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}