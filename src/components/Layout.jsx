import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { LayoutDashboard, ListChecks, Sparkles, Users, Trophy, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tasks", label: "Tasks", icon: ListChecks },
  { path: "/presets", label: "Presets", icon: Sparkles },
  { path: "/family", label: "Family", icon: Users },
  { path: "/leaderboard", label: "Scores", icon: Trophy },
  { path: "/home-setup", label: "Setup", icon: Home },
];

const rootPaths = ["/", "/tasks", "/presets", "/family", "/leaderboard", "/home-setup"];

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
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">HomeFlow</h1>
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
      </aside>

      {/* Mobile Header */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border flex items-center px-2 z-40 gap-2"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3.5rem + env(safe-area-inset-top))' }}
      >
        {!isRootPath ? (
          <>
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-muted-foreground">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="font-heading text-lg font-bold">{currentNav.label}</h1>
          </>
        ) : (
          <h1 className="font-heading text-lg font-bold">HomeFlow</h1>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 md:pt-0" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top))', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <div className="w-full max-w-3xl mx-auto md:pb-8">
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
                if (isActive && location.pathname === path) return; // already at root, do nothing
                if (isActive) { e.preventDefault(); navigate(path, { replace: true }); }
              }}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 select-none transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}