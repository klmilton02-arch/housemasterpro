import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const faqs = [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is HomeLifeFocus?",
        a: "HomeLifeFocus is a family household task management app that helps you organize, schedule, and track all your home maintenance and cleaning tasks. It includes gamification features like XP, levels, and badges to keep the whole family motivated."
      },
      {
        q: "How do I get started?",
        a: "After signing in, start by setting up your home in the Home Setup section — add your rooms (bedrooms, bathrooms, kitchen, etc.). Then add tasks either from our built-in presets or create custom ones. You can assign tasks to family members and set how often they should repeat."
      },
      {
        q: "Can my whole family use the app?",
        a: "Yes! HomeLifeFocus is built for families. You can add family members in the Family section and assign tasks to specific people. Each family member gets their own gamification profile, tracking their XP, level, and badges."
      },
      {
        q: "Is HomeLifeFocus free to use?",
        a: "HomeLifeFocus offers a free tier to get started. Premium features may be available as the platform grows. Check the app for the latest pricing information."
      },
    ]
  },
  {
    category: "Tasks & Scheduling",
    items: [
      {
        q: "How do recurring tasks work?",
        a: "When you add a task, you set a frequency (e.g., every 7 days, every month). Once a task is marked as completed, the next due date is automatically calculated based on that frequency. The task reappears on your list when it's time to do it again."
      },
      {
        q: "What are task presets?",
        a: "Presets are a library of common household tasks (vacuuming, washing dishes, changing filters, paying bills, etc.) that are pre-configured with suggested frequencies and difficulty levels. You can add them to your task list with one tap and adjust the settings as needed."
      },
      {
        q: "Can I assign tasks to specific family members?",
        a: "Yes! When adding or editing a task, you can assign it to any family member. You can also filter the task list by family member to see who is responsible for what."
      },
      {
        q: "What does the 'Rooms' view show?",
        a: "The Rooms view organizes your tasks by room (Kitchen, Bathroom, Bedroom, etc.), making it easy to see all tasks that belong to a specific area of your home at a glance."
      },
      {
        q: "What is the Calendar view?",
        a: "The Calendar view shows all your tasks plotted by their due dates on a monthly calendar. Tasks are color-coded — blue for upcoming, red for overdue, and green for completed — so you can see your schedule at a glance."
      },
      {
        q: "What are subtasks?",
        a: "Subtasks let you break a larger task into smaller steps. Tap on any task to open its detail view, where you can add, check off, and remove subtasks. This is great for multi-step jobs like 'Deep Clean Kitchen.'"
      },
      {
        q: "How do I track bills with HomeLifeFocus?",
        a: "Use the 'Bills' filter on the Tasks page to view all tasks in the 'Bill Schedules' category. You can add recurring bill reminders (e.g., rent due monthly, insurance due yearly) as tasks so nothing slips through the cracks."
      },
    ]
  },
  {
    category: "Gamification & Rewards",
    items: [
      {
        q: "How does the XP and leveling system work?",
        a: "Every time you complete a task you earn XP (experience points). The amount of XP depends on the task's difficulty — harder tasks earn more XP. As you accumulate XP, you level up. Your level and XP are shown on the Rewards (Leaderboard) page and your Profile."
      },
      {
        q: "What are badges?",
        a: "Badges are achievements you unlock by hitting milestones, such as completing your first task, maintaining a streak, completing overdue tasks, or finishing deep-cleaning jobs. Earned badges are displayed on your Profile page."
      },
      {
        q: "What is Blast Mode?",
        a: "Blast Mode is a timed power-up session where all XP earned is doubled. Activate it when you want to knock out a bunch of tasks quickly and earn maximum rewards. A countdown timer is shown across the top of the app while it's active."
      },
      {
        q: "What is a streak?",
        a: "Streaks track how consistently you complete daily tasks. If you complete a daily task within its window each day, your streak grows. Maintaining a long streak can contribute to badge unlocks and bonus XP."
      },
      {
        q: "What is the Leaderboard?",
        a: "The Leaderboard (Rewards page) shows a ranking of family members by total XP earned. It's a fun way to see who's been the most active contributor to keeping the home in great shape."
      },
    ]
  },
  {
    category: "Google Tasks Integration",
    items: [
      {
        q: "Can I sync my tasks with Google Tasks?",
        a: "Yes! HomeLifeFocus supports syncing with Google Tasks. Go to your Profile page and connect your Google account. Once connected, your upcoming maintenance tasks will sync to a dedicated 'HomeLifeFocus' list in Google Tasks."
      },
      {
        q: "How do I connect Google Tasks?",
        a: "Navigate to your Profile page and tap 'Connect Google Tasks.' You'll be redirected to sign in with your Google account and grant permission. Once authorized, you can tap 'Sync to Google Tasks' to push your upcoming tasks."
      },
      {
        q: "Which tasks get synced to Google Tasks?",
        a: "Only incomplete maintenance tasks with due dates within the next 30 days are synced to keep your Google Tasks list focused and relevant."
      },
    ]
  },
  {
    category: "Account & Privacy",
    items: [
      {
        q: "How is my data protected?",
        a: "HomeLifeFocus takes privacy seriously. Your data is stored securely and is only accessible to you and members of your family group. We do not sell your personal data to third parties. For full details, see our Privacy Policy."
      },
      {
        q: "Can I delete my account and data?",
        a: "Yes. If you wish to delete your account and all associated data, please contact us at support@housemasterpro.com and we will process your request promptly."
      },
      {
        q: "How do I sign out?",
        a: "Go to your Profile page and tap the 'Sign Out' button at the bottom of the page."
      },
    ]
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="font-medium text-sm leading-snug">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-16 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-3xl font-bold">Frequently Asked Questions</h1>
        </div>
        <p className="text-muted-foreground">Everything you need to know about HomeLifeFocus.</p>
      </div>

      {faqs.map(section => (
        <div key={section.category}>
          <h2 className="font-heading text-lg font-semibold mb-3 text-foreground">{section.category}</h2>
          <div className="space-y-2">
            {section.items.map(item => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      ))}

      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">Still have questions? We're happy to help.</p>
        <a href="mailto:support@housemasterpro.com" className="text-primary font-medium text-sm hover:underline">
          support@housemasterpro.com
        </a>
      </div>
    </div>
  );
}