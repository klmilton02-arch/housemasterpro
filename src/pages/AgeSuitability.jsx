import { Shield, CheckCircle, XCircle, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function AgeSuitability() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-primary font-heading font-bold text-lg">HomeLifeFocus</Link>
          <span className="text-xs text-muted-foreground">Age Suitability</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Age Suitability</h1>
        </div>
        <p className="text-muted-foreground mb-10">
          HomeLifeFocus is a family household task management app. This page documents the content rating and age suitability of the application.
        </p>

        {/* Rating Badge */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-10 flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-heading font-bold text-primary">13+</div>
            <div className="text-xs text-muted-foreground mt-1">Apple App Store</div>
          </div>
          <div>
            <h2 className="font-heading font-semibold text-foreground text-lg mb-1">Rated 13+ (Ages 13 and Up)</h2>
            <p className="text-muted-foreground text-sm">
              HomeLifeFocus connects to external services (Google Calendar and Google Tasks) which results in a 13+ rating. The app contains no objectionable content and is appropriate for family use under parental supervision.
            </p>
          </div>
        </div>

        {/* Content Review */}
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Content Review</h2>
        <div className="space-y-3 mb-10">
          {[
            { label: "Violence", present: false },
            { label: "Mature or Suggestive Content", present: false },
            { label: "Sexual Content or Nudity", present: false },
            { label: "Profanity or Crude Humor", present: false },
            { label: "Horror or Fear Themes", present: false },
            { label: "Gambling or Simulated Gambling", present: false },
            { label: "Alcohol, Tobacco, or Drug References", present: false },
            { label: "In-App Purchases (non-consumable)", present: false },
            { label: "User-Generated Content", present: false },
          ].map(({ label, present }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
              {present ? (
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
              <span className="text-sm text-foreground">{label}</span>
              <span className={`ml-auto text-xs font-medium ${present ? "text-destructive" : "text-green-600"}`}>
                {present ? "Present" : "None"}
              </span>
            </div>
          ))}
        </div>

        {/* Target Audience */}
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Target Audience</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-card border border-border rounded-xl p-5">
            <Users className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Families</h3>
            <p className="text-sm text-muted-foreground">Designed for households of all sizes to coordinate chores, maintenance, and bills together.</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <Star className="w-5 h-5 text-accent mb-2" />
            <h3 className="font-semibold text-foreground mb-1">All Ages Welcome</h3>
            <p className="text-sm text-muted-foreground">Children can participate in household tasks alongside parents in a safe, positive environment.</p>
          </div>
        </div>

        {/* App Features Summary */}
        <h2 className="text-xl font-heading font-semibold text-foreground mb-4">What the App Does</h2>
        <ul className="space-y-2 mb-10 text-sm text-muted-foreground">
          {[
            "Tracks household cleaning, maintenance, and bill tasks",
            "Assigns tasks to family members",
            "Provides gamification rewards (XP, levels, badges) for completing chores",
            "Integrates with Google Calendar and Google Tasks",
            "Allows families to manage a shared task list",
            "Includes a virtual cat shelter as a fun engagement feature",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Footer note */}
        <div className="border-t border-border pt-6 text-xs text-muted-foreground space-y-1">
          <p>Last updated: June 2, 2026</p>
          <p>For questions, visit our <Link to="/support" className="text-primary underline">Support page</Link> or review our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.</p>
        </div>
      </div>
    </div>
  );
}