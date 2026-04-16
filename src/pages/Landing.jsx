import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { CheckCircle2, Home, Users, Trophy, Calendar, Sparkles, Bell, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FEATURES = [
  {
    icon: <CheckCircle2 className="w-6 h-6 text-primary" />,
    title: "Smart Task Scheduling",
    desc: "Automatically tracks when each task is due based on your custom frequency — daily, weekly, monthly, or yearly.",
  },
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    title: "Family Collaboration",
    desc: "Assign chores to any family member, track who's done what, and keep everyone accountable.",
  },
  {
    icon: <Trophy className="w-6 h-6 text-primary" />,
    title: "Gamification & Rewards",
    desc: "Earn XP, level up, unlock badges, and race your family on the leaderboard. Chores are actually fun.",
  },
  {
    icon: <Calendar className="w-6 h-6 text-primary" />,
    title: "Google Calendar Sync",
    desc: "Sync tasks directly to your Google Calendar so nothing slips through the cracks.",
  },
  {
    icon: <Bell className="w-6 h-6 text-primary" />,
    title: "Overdue Alerts",
    desc: "Get a clear view of what needs attention right now, with a grace period so you're never caught off guard.",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-primary" />,
    title: "Preset Task Library",
    desc: "Hundreds of pre-built household tasks across cleaning, maintenance, and bills — ready to add in one tap.",
  },
];

const TESTIMONIALS = [
  { name: "Sarah M.", text: "We finally stopped arguing about who does what. HouseMasterPro keeps our whole family on track.", stars: 5 },
  { name: "James T.", text: "The gamification is genius — my kids actually compete to finish their chores first.", stars: 5 },
  { name: "Priya K.", text: "Love that it syncs to my calendar. I never miss a maintenance task anymore.", stars: 5 },
];

export default function Landing() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await base44.integrations.Core.SendEmail({
      to: "housemasterpro@gmail.com",
      subject: "New Beta Signup",
      body: `Name: ${name}\nEmail: ${email}`,
    });
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold text-lg">HomeLifeFocus</span>
        </div>
        <Link to="/">
          <Button size="sm">Sign In</Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left: Description */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Home management, reimagined
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold leading-tight mb-4">
              Never forget a chore,<br />bill, or home task again
            </h1>
            <p className="text-foreground text-lg font-medium mb-3">
              HomeLifeFocus is a household task manager for families.
            </p>
            <p className="text-muted-foreground text-base mb-6">
              Create recurring tasks for every room in your home — cleaning, maintenance, bills, and more. Assign them to family members, get overdue alerts, earn XP for completing them, and sync everything to Google Calendar.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {["✅ Recurring schedules", "🏠 Organized by room", "👨‍👩‍👧 Family assignments", "🏆 XP & badges", "📅 Google Calendar sync"].map(item => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          {/* Right: Sign In Card */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-card border border-border rounded-2xl p-7 shadow-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Home className="w-5 h-5 text-primary" />
                <span className="font-heading font-bold text-lg">HomeLifeFocus</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Sign in to manage your home</p>
              <Link to="/" className="block">
                <Button size="lg" className="w-full mb-3">Sign In / Get Started</Button>
              </Link>
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

      {/* Stats */}
      <section className="bg-primary/5 border-y border-border py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { value: "200+", label: "Preset Tasks" },
            { value: "5 min", label: "Setup Time" },
            { value: "∞", label: "Family Members" },
            { value: "100%", label: "Free to Start" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <p className="font-heading text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-center mb-2">Everything your home needs</h2>
        <p className="text-muted-foreground text-center mb-10">One app to manage it all — no spreadsheets, no sticky notes.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-heading font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-center mb-10">Families love it</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-blue-600 border border-blue-500 rounded-xl p-5">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-white mb-4">"{t.text}"</p>
              <p className="text-xs font-semibold text-blue-200">— {t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-center mb-2">Get started</h2>
        <p className="text-muted-foreground text-center mb-10">Access all features in one place.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tasks Card - takes full width, side-by-side layout */}
          <div key="tasks" className="sm:col-span-2 lg:col-span-1 bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1">
                <h3 className="font-heading font-semibold mb-1">Tasks</h3>
                <p className="text-sm text-muted-foreground">Manage and track all your household tasks with smart scheduling.</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-primary flex-shrink-0" />
            </div>
          </div>

          {/* Other action cards */}
          {[
            { icon: <Home className="w-6 h-6 text-primary" />, title: "Home Setup", desc: "Configure your home layout and rooms for personalized task management." },
            { icon: <Users className="w-6 h-6 text-primary" />, title: "Family", desc: "Manage family members and assign tasks to keep everyone on track." },
            { icon: <Trophy className="w-6 h-6 text-primary" />, title: "Leaderboard", desc: "Track progress and see who's earning the most XP this month." },
            { icon: <Calendar className="w-6 h-6 text-primary" />, title: "Presets", desc: "Browse hundreds of pre-built tasks ready to add to your list." },
            { icon: <Sparkles className="w-6 h-6 text-primary" />, title: "Sync Calendar", desc: "Keep tasks in sync with your Google Calendar automatically." },
          ].map(item => (
            <div key={item.title} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="mb-3">{item.icon}</div>
              <h3 className="font-heading font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground flex-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

       {/* CTA / Waitlist */}
       <section className="bg-primary/5 border-y border-border py-16 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold mb-2">Ready to take control?</h2>
          <p className="text-muted-foreground mb-6">Join the waitlist and be among the first to get access.</p>
          {submitted ? (
            <div className="bg-card border border-border rounded-xl p-6">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="font-semibold">You're on the list!</p>
              <p className="text-sm text-muted-foreground mt-1">We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
              <Input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Joining..." : "Join the Waitlist"}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Home className="w-4 h-4 text-black dark:text-white" />
          <span className="font-heading font-semibold text-foreground">HomeLifeFocus</span>
        </div>
        <div className="flex justify-center gap-6 mb-3">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          <Link to="/" className="hover:text-foreground transition-colors">Sign In</Link>
        </div>
        <p>© {new Date().getFullYear()} HomeLifeFocus. All rights reserved.</p>
      </footer>
    </div>
  );
}