import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ListChecks, Trophy, Users, Zap, Home } from "lucide-react";

const FEATURES = [
  { icon: ListChecks, title: "Smart Task Scheduling", desc: "Auto-calculates next due dates based on frequency — never forget a chore again." },
  { icon: Users, title: "Family Collaboration", desc: "Assign tasks to family members and see who's keeping up." },
  { icon: Trophy, title: "Gamification & Streaks", desc: "Earn XP, level up, unlock badges, and compete on the family leaderboard." },
  { icon: Zap, title: "Google Calendar Sync", desc: "Sync tasks directly to your Google Calendar for reminders." },

];

export default function Landing() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    await base44.integrations.Core.SendEmail({
      to: "housemasterpro@gmail.com",
      subject: `Beta Access Request – ${name}`,
      body: `Name: ${name}\nEmail: ${email}\n\nRequested beta access to HouseMasterPro.`,
    });
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20 max-w-2xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Home className="w-3.5 h-3.5" /> Now in Beta
        </div>
        <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight tracking-tight text-foreground">
          Your home, <span className="text-primary">under control.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-lg">
          HouseMasterPro turns home maintenance into a team sport. Track chores, earn rewards, and never let a task fall through the cracks.
        </p>

        {/* Waitlist form */}
        <div className="mt-10 w-full max-w-md">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-8">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="font-heading font-bold text-lg">You're on the list!</p>
              <p className="text-sm text-muted-foreground">We'll reach out with your invite soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3 text-left">
              <p className="font-heading font-semibold text-base mb-1">Request Beta Access</p>
              <Input
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading || !name || !email}>
                {loading ? "Sending..." : "Request Access →"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">No spam. Just your invite when a spot opens.</p>
            </form>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-5 flex gap-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border text-center py-6 text-xs text-muted-foreground">
        © 2026 HouseMasterPro. All rights reserved.
      </footer>
    </div>
  );
}