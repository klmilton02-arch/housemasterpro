import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function PublicFooter() {
  return (
    <footer className="py-8 px-6 text-center text-sm text-muted-foreground border-t border-border mt-8">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Home className="w-4 h-4 text-primary" />
        <span className="font-heading font-semibold text-foreground">HomeLifeFocus</span>
      </div>
      <div className="flex justify-center gap-5 flex-wrap">
        <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
        <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
        <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
      </div>
    </footer>
  );
}