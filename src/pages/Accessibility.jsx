import { Shield, CheckCircle, Moon, Type, Minus } from "lucide-react";
import { Link } from "react-router-dom";

const SUPPORTED = [
  {
    icon: <Moon className="w-5 h-5 text-primary" />,
    title: "Dark Interface",
    desc: "HomeLifeFocus fully supports dark mode. The entire app — all screens, dialogs, and components — responds automatically to your device's system appearance setting.",
  },
  {
    icon: <Type className="w-5 h-5 text-primary" />,
    title: "Larger Text",
    desc: "The app uses responsive, scalable text sizing throughout. System-level font size adjustments are respected across all primary screens.",
  },
];

const NOT_SUPPORTED = [
  "VoiceOver",
  "Voice Control",
  "Differentiate Without Color Alone",
  "Sufficient Contrast (not formally audited)",
  "Reduced Motion",
  "Captions (no audio/video content)",
  "Audio Descriptions (no video content)",
];

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-primary font-heading font-bold text-lg">HomeLifeFocus</Link>
          <span className="text-xs text-muted-foreground">Accessibility</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Accessibility</h1>
        </div>
        <p className="text-muted-foreground mb-10">
          HomeLifeFocus is committed to being usable by as many people as possible. This page documents the accessibility features currently supported in the app.
        </p>

        {/* Supported Features */}
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Supported Features</h2>
        <div className="space-y-4 mb-10">
          {SUPPORTED.map(({ icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-5 flex gap-4">
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Not Currently Supported */}
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Not Currently Supported</h2>
        <div className="bg-card border border-border rounded-xl p-5 mb-10">
          <p className="text-sm text-muted-foreground mb-4">
            The following accessibility features are not yet fully implemented or have not been formally audited:
          </p>
          <ul className="space-y-2">
            {NOT_SUPPORTED.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Minus className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Feedback */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-10">
          <h2 className="font-heading font-semibold text-foreground mb-2">Feedback & Requests</h2>
          <p className="text-sm text-muted-foreground">
            If you have an accessibility need that isn't currently met, please reach out via our{" "}
            <Link to="/support" className="text-primary underline">Support page</Link>. We take all accessibility feedback seriously and aim to improve over time.
          </p>
        </div>

        {/* Footer note */}
        <div className="border-t border-border pt-6 text-xs text-muted-foreground space-y-1">
          <p>Last updated: June 2, 2026</p>
          <p>
            See also:{" "}
            <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>
            {" · "}
            <Link to="/age-suitability" className="text-primary underline">Age Suitability</Link>
          </p>
        </div>
      </div>
    </div>
  );
}