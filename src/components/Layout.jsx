import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListChecks, Sparkles, Trophy, Home, User, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import MobileHeader from "./MobileHeader";
import { useBlastMode } from "@/lib/BlastModeContext";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, iconColor: "text-black dark:text-white" },
  { path: "/tasks", label: "Tasks", icon: ListChecks, iconColor: "text-black dark:text-white" },
  { path: "/leaderboard", label: "Rewards", icon: Trophy, iconColor: "text-black dark:text-white" },
  { path: "/presets", label: "Presets", icon: Sparkles, iconColor: "text-black dark:text-white" },
  { path: "/home-setup", label: "Home Setup", icon: Home, iconColor: "text-black dark:text-white" },
];

const rootPaths = ["/", "/tasks", "/presets", "/leaderboard", "/home-setup"];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isActive, timeLeft, duration } = useBlastMode();

  const blastMins = Math.floor(timeLeft / 60);
  const blastSecs = String(timeLeft % 60).padStart(2, "0");
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
          <p className="text-xs text-muted-foreground mt-1">HomeLifeFocus</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon, iconColor }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all select-none",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className={cn("w-4 h-4", !isActive && iconColor)} />
                {label}
              </Link>
            );
          })}
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

      {/* Global Blast Mode Banner */}
      {isActive && (
        <div
          className="fixed left-0 right-0 z-50 md:left-64 flex items-center justify-center gap-2 text-sm font-bold py-1.5 shadow-md overflow-hidden"
          style={{ top: 'calc(3rem + env(safe-area-inset-top))', background: '#fde68a' }}
        >
          {/* Fill bar growing left-to-right */}
          <div
            className="absolute inset-0 bg-orange-600 transition-none"
            style={{ width: `${((duration * 60 - timeLeft) / (duration * 60)) * 100}%` }}
          />
          {/* Text sits above the fill */}
          <span className="relative z-10 flex items-center gap-2 text-black mix-blend-multiply">
            <Zap className="w-4 h-4" /> Blast Mode Active — {blastMins}:{blastSecs} remaining
          </span>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 md:pt-0 md:pb-8" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top))', paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}>
        <div className="w-full max-w-sm md:max-w-4xl mx-auto md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 overflow-x-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex min-w-max">
        {navItems.map(({ path, label, icon: Icon, iconColor }) => {
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
                "w-20 flex flex-col items-center justify-center py-2 gap-0.5 select-none transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", iconColor)} />
              <span className="text-[10px] font-medium leading-tight text-center text-black dark:text-white">{label}</span>
            </Link>
          );
        })}
        <Link
          to="/profile"
          className={cn(
            "w-20 flex flex-col items-center justify-center py-2 gap-0.5 select-none transition-colors",
            location.pathname === "/profile" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight text-center text-black dark:text-white">Profile</span>
        </Link>
        </div>
      </nav>
    </div>
  );
}