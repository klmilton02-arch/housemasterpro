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
            HomeLifeFocus is a household task management app designed to help individuals, couples, housemates, and families manage home maintenance and chores. Additionally, users can create personal task lists in order to track and remember anything – even things unrelated to home maintenance and chores.
          </p>
          <p>
            I built HomeLifeFocus because I live in a 2600 square foot home with a total of 6 people and remaining abreast of household tasks was overwhelming and difficult to manage. I wanted an app that would enable households to work together. Also, I received an owner's manual for my house which included recommended maintenance tasks. I've lived in numerous houses and apartments over the years, and have never cleaned light fixtures, nor have I ever done anything with vent registers or window tracks.
          </p>
          <p>
            Furthermore, the thought of "cleaning the house" was generally overwhelming to me. I had a vague idea that carpets should be cleaned at some point, but wasn't sure what that point was.
          </p>
          <p>
            I wasn't able to find an app that had an exhaustive list of potential chores and maintenance tasks with recommended frequencies, divided by room. There were apps with presets, but I wanted a more detailed list. I was also not able to find an app that offered preset household related chores and tasks in addition to personal tasks and chores.
          </p>
        </div>
      </div>

      <div className="text-sm text-muted-foreground flex gap-4">
        <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
        <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        <Link to="/landing" className="hover:text-foreground transition-colors">Back to Home</Link>
      </div>
    </div>
  );
}