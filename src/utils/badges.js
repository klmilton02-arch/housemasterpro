// Badge definitions with requirements and metadata
export const BADGE_DEFINITIONS = {
  first_task: {
    id: "first_task",
    name: "Getting Started",
    description: "Complete your first task",
    icon: "🌟",
    requirement: "total_completions >= 1"
  },
  five_tasks: {
    id: "five_tasks",
    name: "Task Master",
    description: "Complete 5 tasks",
    icon: "⭐",
    requirement: "total_completions >= 5"
  },
  twenty_tasks: {
    id: "twenty_tasks",
    name: "Home Hero",
    description: "Complete 20 tasks",
    icon: "🦸",
    requirement: "total_completions >= 20"
  },
  fifty_tasks: {
    id: "fifty_tasks",
    name: "Household Legend",
    description: "Complete 50 tasks",
    icon: "👑",
    requirement: "total_completions >= 50"
  },
  week_streak: {
    id: "week_streak",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    requirement: "max_streak >= 7"
  },
  month_streak: {
    id: "month_streak",
    name: "Consistency King",
    description: "Maintain a 30-day streak",
    icon: "💪",
    requirement: "max_streak >= 30"
  },
  deep_cleaner: {
    id: "deep_cleaner",
    name: "Deep Cleaner",
    description: "Complete 5 deep cleaning tasks",
    icon: "✨",
    requirement: "deep_cleaning_completions >= 5"
  },
  overdue_master: {
    id: "overdue_master",
    name: "Catch-Up Champion",
    description: "Complete 5 overdue tasks",
    icon: "⚡",
    requirement: "overdue_completions >= 5"
  },
  level_five: {
    id: "level_five",
    name: "Rising Star",
    description: "Reach Level 5",
    icon: "🌠",
    requirement: "level >= 5"
  },
  level_ten: {
    id: "level_ten",
    name: "Master of Home",
    description: "Reach Level 10",
    icon: "🏆",
    requirement: "level >= 10"
  }
};

export function checkBadgeEarned(profile, badgeId) {
  const badge = BADGE_DEFINITIONS[badgeId];
  if (!badge) return false;

  const checks = {
    "total_completions >= 1": profile.total_completions >= 1,
    "total_completions >= 5": profile.total_completions >= 5,
    "total_completions >= 20": profile.total_completions >= 20,
    "total_completions >= 50": profile.total_completions >= 50,
    "max_streak >= 7": (profile.max_streak || 0) >= 7,
    "max_streak >= 30": (profile.max_streak || 0) >= 30,
    "deep_cleaning_completions >= 5": profile.deep_cleaning_completions >= 5,
    "overdue_completions >= 5": profile.overdue_completions >= 5,
    "level >= 5": profile.level >= 5,
    "level >= 10": profile.level >= 10,
  };

  return checks[badge.requirement] || false;
}

export function getEarnedBadges(profile) {
  return Object.keys(BADGE_DEFINITIONS).filter(badgeId => 
    checkBadgeEarned(profile, badgeId)
  );
}