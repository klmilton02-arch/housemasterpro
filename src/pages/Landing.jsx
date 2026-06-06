import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Home, Users, Trophy, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: <CheckCircle2 className="w-6 h-6 text-primary" />,
    title: "Smart Task Scheduling",
    desc: "Automatically tracks due dates for each task, based on customizable frequencies which include daily, weekly, monthly, yearly, and everything in-between.",
  },
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    title: "Collaboration",
    desc: "Join as a Family in order to assign chores to any household member in order to track who has done what and when in order to keep everyone accountable.",
  },
  {
    icon: <Trophy className="w-6 h-6 text-primary" />,
    title: "Gamification & Rewards",
    desc: "Earn XP, level up, unlock badges, and follow your progress as a Solo user. Compete with other members of your household as part of a family!",
  },
  {
    icon: <Calendar className="w-6 h-6 text-primary" />,
    title: "Google Calendar Sync",
    desc: "Sync tasks directly to your Google Calendar.",
  },

  {
    icon: <Sparkles className="w-6 h-6 text-primary" />,
    title: "Preset Task Library",
    desc: "Pre-set household tasks — with associated difficulty level and frequency — enable you to add to your to-do list with only a couple taps. Pre-sets are also modifiable so that you can meet your unique household needs.",
  },
];

export default function Landing() {
  const [signingIn, setSigningIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.isAuthenticated().then(authed => {
      if (authed) navigate("/dashboard", { replace: true });
    });
  }, []);

  const handleSignIn = () => {
    window.location.href = "/login";
  };


  return (
    <div className="min-h-screen bg-background text-foreground font-body">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 pt-4 pb-3 lg:pb-0 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold text-lg">HomeLifeFocus</span>
        </div>
        <Button size="sm" onClick={handleSignIn} disabled={signingIn}>
          {signingIn ? "Redirecting..." : "Sign In"}
        </Button>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-3 lg:pt-8 pb-4 lg:pb-16 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
          {/* Left: Description */}
          <div className="flex-1 text-left lg:text-left">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
              Home management, reimagined
            </span>


            <p className="text-muted-foreground text-base mb-6">
              Create recurring tasks for every room in your home — cleaning, maintenance, bills, and more. Assign them to family members, get overdue alerts, earn XP for completing them, and sync everything to Google Calendar.
            </p>

            {/* Stats — desktop only, 3 columns under the badge */}
            <div className="hidden lg:grid grid-cols-3 gap-3">
              {[
                { value: "200+", label: "Preset Tasks" },
                { value: "5 min", label: "Setup Time" },
                { value: "Solo or Family", label: "Join as Solo or Family" },
              ].map(stat => (
                <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="font-heading text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* "Everything your home needs" heading — desktop only, below stats */}
            <h2 className="hidden lg:block font-heading text-2xl font-bold mt-8">Everything your home needs</h2>

          </div>

          {/* Right: Sign In Card */}
          <div className="w-full lg:w-80 shrink-0 -mt-6 lg:mt-0">
            <div className="bg-card border border-border rounded-2xl p-7 shadow-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Home className="w-5 h-5 text-primary" />
                <span className="font-heading font-bold text-lg">HomeLifeFocus</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Sign in to manage your home</p>
              <Button size="lg" className="w-full mb-3" onClick={handleSignIn} disabled={signingIn}>
                {signingIn ? "Redirecting..." : "Sign In / Get Started"}
              </Button>
              <p className="text-xs text-muted-foreground">Free to use · No credit card needed</p>
              <div className="mt-5 pt-5 border-t border-border space-y-2 text-left">
                {["Track tasks for every room", "Assign chores to family members", "Earn XP and level up", "Sync with Google Calendar"].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — desktop only, full width 5 columns below hero */}
      <section className="hidden lg:block px-6 pb-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-5 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="mb-2">{f.icon}</div>
              <h3 className="font-heading font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats — mobile/tablet only — hidden */}
      <section className="hidden bg-primary/5 border-y border-border py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { value: "200+", label: "Preset Tasks" },
            { value: "5 min", label: "Setup Time" },
            { value: "Solo or Family", label: "Join as a Solo User or as a Family" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <p className="font-heading text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features — mobile/tablet only */}
      <section id="features" className="lg:hidden pt-4 pb-12 px-6 max-w-5xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-left mb-10">Everything your home needs</h2>
        <div className="grid grid-cols-1 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-3 sm:p-3 hover:shadow-md transition-shadow sm:flex sm:items-start sm:gap-3">
              <div className="mb-2 sm:mb-0 sm:shrink-0">{f.icon}</div>
              <div>
                <h3 className="font-heading font-semibold mb-0.5 text-sm sm:text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>





      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Home className="w-4 h-4 text-black dark:text-white" />
          <span className="font-heading font-semibold text-foreground">HomeLifeFocus</span>
        </div>
        <div className="flex justify-center gap-6 mb-3">
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          <button onClick={handleSignIn} className="hover:text-foreground transition-colors" disabled={signingIn}>{signingIn ? "Redirecting..." : "Sign In"}</button>
        </div>
        <p>© {new Date().getFullYear()} HomeLifeFocus. All rights reserved.</p>
      </footer>
    </div>
  );
}