import { useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Home, Check, ZoomIn, ZoomOut } from "lucide-react";
import { useLargeIcons } from "@/lib/LargeIconsContext";

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
  const { largeIcons, toggle } = useLargeIcons();

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border flex items-end justify-between px-4 pb-2"
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))', minHeight: 'calc(3rem + env(safe-area-inset-top))' }}
    >
      {isRoot ? (
        <Link to="/" className="flex flex-col">
          <div className="flex items-center gap-2">
             <div className="relative w-7 h-7">
               <Home className="w-7 h-7 fill-blue-500 text-blue-500" />
               <Check className="absolute inset-0 w-7 h-7 text-slate-100 stroke-2" strokeWidth={3} />
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
      <button
        onClick={toggle}
        className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
        title={largeIcons ? "Standard size" : "Large icons (accessibility)"}
      >
        {largeIcons ? <ZoomOut className="w-4 h-4 text-muted-foreground" /> : <ZoomIn className="w-4 h-4 text-muted-foreground" />}
      </button>
    </header>
  );
}