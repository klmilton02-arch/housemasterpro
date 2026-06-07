import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";

const faqs = [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is HomeLifeFocus?",
        a: "HomeLifeFocus is a household task management app that helps to organize, schedule, and track home maintenance and cleaning tasks. Keep track of home chores as a solo user or compete with other family members or housemates. The app includes gamification features including XP, levels, and badges."
      },
      {
        q: "How do I get started?",
        a: "When signing in for the first time, choose Solo or Family. The Solo setting enables one person to manage household chores and maintenance tasks. If you pick Family, you can either join an existing Family or you can start your own. If you start with a Solo account you can join a family later."
      },
      {
        q: "What is the difference between Solo and Family?",
        a: "Solo enables one person to organize household maintenance tasks and chores. A Solo user can earn XP and badges. There is also a Cat Shelter for each player — when a player has reached sufficient XP, he or she can adopt one or more cats. When chores or household maintenance tasks are neglected, one or more of the cats may run away. A family account is similar. In this case, each member of a family or household has the same list of chores and household maintenance tasks. Once one person in a family or household checks off a particular chore or maintenance task, said chore or maintenance task is 'completed' on everyone's list. As part of a family, you can compete with others to earn the most XP."
      },
      {
        q: "How does household set up work?",
        a: "There are a number of available room types, including bedroom, living room, dining room, mixed use room, office, full bathroom, and half bathroom. In addition, you can add an attic, basement, and/or garage. You can chose any number of bedrooms or bathrooms and check off other room types within your house or apartment. After this, HomeLifeFocus will generate a list of chores and household maintenance tasks for individual rooms. There are certain tasks designated 'whole house.' These tasks are not unique to any particular room — for instance, tasks surrounding outdoor drainage are not designated to a particular room or part of the house."
      },
      {
        q: "Can I create my own tasks?",
        a: "Absolutely, you can pick tasks or chores from a preset list. You click Add Task then you can add a preset task, or, you can create your own custom task. If you click Preset or Custom, any tasks generated will be added to the whole family task list (or, if you are a Solo user, said tasks will be added to your list). You can also add Personal tasks. These tasks will be added to your personal list and not shared between family members. For instance, you may want a reminder to check your personal email daily. If you add this as a personal task, this will wind up on your personal task list, even if you are a member of a family."
      },
      {
        q: "How do preset tasks work?",
        a: "Presets are a library of common household tasks (vacuuming, washing dishes, changing filters, paying bills, etc.) that are pre-configured with suggested frequencies and difficulty levels. Many of the presets will be added automatically based on household set-up. You can pick additional preset tasks through the Add Task button on the Tasks portion of the App."
      },
      {
        q: "Which tasks will wind up on the family list versus your own personal list?",
        a: "If you are a Solo user this is a moot point — all the tasks will be on your list. If you are part of a family, then from Add Task, Preset or Custom tasks will be added to the whole family list. Personal tasks will be added to your personal list, not the shared family list."
      },
      {
        q: "The app generated multiple Living Room tasks. Carpet cleaning is on the list of tasks but I don't have carpets in my living room. What can I do?",
        a: "You can delete the task from the task list. The task will disappear from the Family List. You can do this for any task that is irrelevant to you or your household."
      },
      {
        q: "What is Blast Mode?",
        a: "Blast Mode sets off a 30 minute timer. Any task done within that 30 minutes earns double XP."
      },
      {
        q: "I don't know how to do certain tasks, such as Cleaning Vent Registers. What do I do?",
        a: "If there is a task that you are not comfortable completing yourself, you can engage a professional."
      },
      {
        q: "I tried to perform a task and now I have damaged my home. Is the App creator responsible for this?",
        a: "No, the app creator is not responsible for damage to your home sustained while performing a chore or maintenance task."
      },
      {
        q: "Can I assign tasks to a particular family member?",
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
    ]
  },
  {
    category: "Gamification & Rewards",
    items: [
      {
        q: "The Leaderboard (Rewards page) shows a ranking of family members by total XP earned. It's a fun way to see who's been the most active contributor to keeping the home in great shape. If you are a Solo user, you can also earn XP and badges, but, will not be part of a leaderboard.",
        a: "The Leaderboard (Rewards page) shows a ranking of family members by total XP earned. It's a fun way to see who's been the most active contributor to keeping the home in great shape. If you are a Solo user, you can also earn XP and badges, but will not be part of a leaderboard."
      },
    ]
  },
  {
    category: "Google Calendar Integration",
    items: [
      {
        q: "How do I determine start dates?",
        a: "You have the option of picking a particular start date. When you pick a start date, then all the tasks are due on the start date by default. You can defer or postpone certain tasks. If you have a monthly task, due on the start date, you can defer to the next month, or to any other date. Once that task is completed the next due date will be a month from the date of completion. If you do not pick a start date, all daily tasks will be due the day after you set up the app, weekly tasks will be due a week from the date of app set-up, etc. Tasks are added to your Google calendar automatically."
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
        q: "Can I delete my account?",
        a: "Yes. If you wish to delete your account and all associated data, go to Profile and then Delete My Account."
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
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h1 className="font-heading text-3xl font-bold">Frequently Asked Questions</h1>
          </div>
          <p className="text-muted-foreground">Everything you need to know about HomeLifeFocus.</p>
        </div>
        <Link to="/landing" className="text-primary hover:underline font-medium text-sm whitespace-nowrap ml-4">
          Back to Home
        </Link>
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
        <a href="mailto:klmilton02@gmail.com" className="text-primary font-medium text-sm hover:underline">
          klmilton02@gmail.com
        </a>
      </div>
      <PublicFooter />
    </div>
  );
}