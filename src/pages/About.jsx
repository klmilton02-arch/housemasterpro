import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-16 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Home className="w-6 h-6 text-primary" />
          <span className="text-sm text-muted-foreground font-medium">HomeLifeFocus</span>
        </div>
        <h1 className="font-heading text-3xl font-bold mb-4">About HomeLifeFocus</h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            HomeLifeFocus is a household task management app designed to help families, couples, and housemates stay on top of everything it takes to run a home — from weekly cleaning and monthly maintenance to recurring bills and personal to-dos.
          </p>
          <p>
            We built HomeLifeFocus because managing a home is genuinely hard work, and most task apps weren't built with households in mind. With HomeLifeFocus, you can set up every room in your home, add recurring tasks with custom frequencies, and assign them to specific family members so everyone knows what they're responsible for.
          </p>
          <p>
            What makes HomeLifeFocus different is its built-in gamification system. Every completed task earns XP, unlocks badges, and moves you up the family leaderboard — turning chores into something the whole household actually wants to participate in. You can even adopt and care for virtual cats as a reward for staying on top of your tasks.
          </p>
          <p>
            The app also syncs with Google Calendar so your tasks show up alongside the rest of your schedule, and it includes a library of 200+ preset tasks to get you started in minutes.
          </p>
          <p>
            HomeLifeFocus is built and maintained by a small, independent team passionate about helping people feel less overwhelmed at home. We're always improving the app based on real user feedback.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-2">
        <h2 className="font-heading font-semibold text-lg">Quick Facts</h2>
        <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
          <li>200+ preset household tasks ready to use</li>
          <li>Supports unlimited family members</li>
          <li>Gamified XP, levels, badges, and leaderboards</li>
          <li>Google Calendar sync built in</li>
          <li>Free to get started — no credit card required</li>
        </ul>
      </div>

      <div className="text-sm text-muted-foreground flex gap-4">
        <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
        <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
      </div>
    </div>
  );
}