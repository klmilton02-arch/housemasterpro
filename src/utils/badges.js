// Badge definitions with requirements and metadata
export const BADGE_DEFINITIONS = {
  first_task: {
    id: "first_task",
    name: "First Task",
    description: "Complete your first task (any type)",
    icon: "🌟",
    bonusPoints: 0,
    requirement: "total_completions >= 1"
  },
  cleaning_streak_7: {
    id: "cleaning_streak_7",
    name: "Cleaning Streak",
    description: "Clean 7 days in a row",
    icon: "🔥",
    bonusPoints: 100,
    requirement: "cleaning_streak >= 7"
  },
  maintenance_guru: {
    id: "maintenance_guru",
    name: "Maintenance Guru",
    description: "Complete 5 maintenance tasks",
    icon: "🔧",
    bonusPoints: 200,
    requirement: "maintenance_completions >= 5"
  },
  bill_pay_pro: {
    id: "bill_pay_pro",
    name: "Bill Pay Pro",
    description: "Pay bills on time for 3 months",
    icon: "💳",
    bonusPoints: 300,
    requirement: "bill_months_ontime >= 3"
  },
  all_rounder: {
    id: "all_rounder",
    name: "All-Rounder",
    description: "Complete cleaning, maintenance, and bill tasks each week for a month",
    icon: "🏅",
    bonusPoints: 500,
    requirement: "all_rounder_weeks >= 4"
  },
  // Legacy / milestone badges
  task_master: {
    id: "task_master",
    name: "Task Master",
    description: "Complete 20 tasks",
    icon: "⭐",
    bonusPoints: 0,
    requirement: "total_completions >= 20"
  },
  household_legend: {
    id: "household_legend",
    name: "Household Legend",
    description: "Complete 50 tasks",
    icon: "👑",
    bonusPoints: 0,
    requirement: "total_completions >= 50"
  },
  catch_up_champion: {
    id: "catch_up_champion",
    name: "Catch-Up Champion",
    description: "Complete 5 overdue tasks",
    icon: "⚡",
    bonusPoints: 0,
    requirement: "overdue_completions >= 5"
  },
};

export function checkBadgeEarned(profile, badgeId) {
  const badge = BADGE_DEFINITIONS[badgeId];
  if (!badge) return false;

  const checks = {
    "total_completions >= 1": (profile.total_completions || 0) >= 1,
    "cleaning_streak >= 7": (profile.cleaning_streak || 0) >= 7,
    "maintenance_completions >= 5": (profile.maintenance_completions || 0) >= 5,
    "bill_months_ontime >= 3": (profile.bill_months_ontime || 0) >= 3,
    "all_rounder_weeks >= 4": (profile.all_rounder_weeks || 0) >= 4,
    "total_completions >= 20": (profile.total_completions || 0) >= 20,
    "total_completions >= 50": (profile.total_completions || 0) >= 50,
    "overdue_completions >= 5": (profile.overdue_completions || 0) >= 5,
  };

  return checks[badge.requirement] || false;
}

export function getEarnedBadges(profile) {
  return Object.keys(BADGE_DEFINITIONS).filter(badgeId =>
    checkBadgeEarned(profile, badgeId)
  );
}