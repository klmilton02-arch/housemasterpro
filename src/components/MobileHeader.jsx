import { useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Home, Check } from "lucide-react";

const ROOT_PATHS = ["/", "/tasks", "/presets", "/family", "/leaderboard", "/home-setup", "/burst", "/profile", "/dashboard"];

const PAGE_TITLES = {
  "/needs-attention": "Needs Attention",
  "/privacy": "Privacy Policy",
  "/support": "Support",
};

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = ROOT_PATHS.includes(location.pathname);
  const title = PAGE_TITLES[location.pathname] || "HomeLifeFocus";

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border flex items-end px-4 pb-2"
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))', minHeight: 'calc(3rem + env(safe-area-inset-top))' }}
    >
      {isRoot ? (
        <Link to="/" className="flex flex-col">
          <div className="flex items-center gap-2">
             <div className="relative w-5 h-5">
               <Home className="w-5 h-5 fill-primary text-primary" />
               <Check className="absolute inset-0 w-5 h-5 text-primary" />
             </div>
             <h1 className="font-heading text-lg font-bold leading-tight text-foreground">HomeLifeFocus</h1>
           </div>
        </Link>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-0.5 text-primary font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-muted-foreground">·</span>
          <span className="font-heading font-semibold text-sm text-foreground">{title}</span>
        </div>
      )}
    </header>
  );
}