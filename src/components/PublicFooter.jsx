import { Home } from "lucide-react";
import { Link } from "react-router-dom";

const footerSections = [
  {
    heading: "App",
    links: [
      { label: "Sign In", to: "/login" },
      { label: "Register", to: "/register" },
      { label: "Forgot Password", to: "/forgot-password" },
      { label: "Reset Password", to: "/reset-password" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "FAQ", to: "/faq" },
      { label: "Support", to: "/support" },
      { label: "Contact", to: "/contact" },
      { label: "About", to: "/about" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Copyright", to: "/copyright" },
      { label: "Digital Services Act", to: "/digital-services-act" },
      { label: "Encryption", to: "/encryption" },
      { label: "Age Suitability", to: "/age-suitability" },
      { label: "Accessibility", to: "/accessibility" },
    ],
  },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-border mt-12 pt-10 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <Home className="w-5 h-5 text-primary" />
          <span className="font-heading font-bold text-foreground text-lg">HomeLifeFocus</span>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-8">
          {footerSections.map(section => (
            <div key={section.heading}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {section.heading}
              </p>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground border-t border-border pt-6 text-center">
          © {new Date().getFullYear()} HomeLifeFocus. All rights reserved.
        </p>
      </div>
    </footer>
  );
}