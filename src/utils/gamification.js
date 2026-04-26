import { base44 } from "@/api/base44Client";
import { parseISO, differenceInDays } from "date-fns";

const DIFFICULTY_POINTS = {
  "Trivial": 1,
  "Easy": 2,
  "Medium": 3,
  "Hard": 4,
  "Very Hard": 5,
};

export const LEVELS = [
  { level: 1, minXP: 0, title: "Novice Cleaner" },
  { level: 2, minXP: 50, title: "Cleaning Helper" },
  { level: 3, minXP: 150, title: "Home Maintainer" },
  { level: 4, minXP: 300, title: "Cleaning Pro" },
  { level: 5, minXP: 500, title: "Household Hero" },
  { level: 6, minXP: 750, title: "Home Expert" },
  { level: 7, minXP: 1100, title: "Master Maintainer" },
  { level: 8, minXP: 1500, title: "Home Champion" },
  { level: 9, minXP: 2000, title: "Household Legend" },
  { level: 10, minXP: 2700, title: "Master of Home" },
];

// Used by Leaderboard for badge display
export const ACHIEVEMENT_BADGES = [
  { id: "first_task", name: "First Task", emoji: "🌟" },
  { id: "cleaning_streak_7", name: "Cleaning Streak", emoji: "🔥" },
  { id: "maintenance_guru", name: "Maintenance Guru", emoji: "🔧" },
  { id: "bill_pay_pro", name: "Bill Pay Pro", emoji: "💳" },
  { id: "all_rounder", name: "All-Rounder", emoji: "🏅" },
  { id: "task_master", name: "Task Master", emoji: "⭐" },
  { id: "household_legend", name: "Household Legend", emoji: "👑" },
  { id: "catch_up_champion", name: "Catch-Up Champion", emoji: "⚡" },
];

export function getTaskPoints(task) {
  return DIFFICULTY_POINTS[task.difficulty] ?? 2;
}

export function getLevelInfo(xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXP) current = lvl;
  }
  const nextIdx = LEVELS.findIndex(l => l.level === current.level + 1);
  const next = nextIdx >= 0 ? LEVELS[nextIdx] : null;
  const progress = next
    ? Math.round(((xp - current.minXP) / (next.minXP - current.minXP)) * 100)
    : 100;
  return { ...current, next, progress, xpToNext: next ? next.minXP - xp : 0 };
}

function isCleaning(task) {
  const cat = (task.category || "").toLowerCase();
  const type = (task.task_type || task.category || "").toLowerCase();
  return type.includes("cleaning") || cat.includes("cleaning");
}

function isMaintenance(task) {
  const type = (task.task_type || task.category || "").toLowerCase();
  return type.includes("maintenance");
}

function isBill(task) {
  const cat = (task.category || "").toLowerCase();
  return cat.includes("bill");
}

function checkNewBadges(profile) {
  const earned = profile.badges || [];
  const checks = {
    "first_task": (profile.total_completions || 0) >= 1,
    "cleaning_streak_7": (profile.cleaning_streak || 0) >= 7,
    "maintenance_guru": (profile.maintenance_completions || 0) >= 5,
    "bill_pay_pro": (profile.bill_months_ontime || 0) >= 3,
    "all_rounder": (profile.all_rounder_weeks || 0) >= 4,
    "task_master": (profile.total_completions || 0) >= 20,
    "household_legend": (profile.total_completions || 0) >= 50,
    "catch_up_champion": (profile.overdue_completions || 0) >= 5,
  };
  return Object.keys(checks).filter(id => !earned.includes(id) && checks[id]);
}

export async function revokePoints(task, wasBlastRunning = false) {
  let memberId = task.assigned_to;
  let memberName = task.assigned_to_name;

  if (!memberId || !memberName) {
    const me = await base44.auth.me();
    if (!me) return;
    memberId = me.id;
    memberName = me.full_name;
  }

  const pointsToRevoke = getTaskPoints(task) * (wasBlastRunning ? 2 : 1);

  const profiles = await base44.entities.GamificationProfile.filter({ family_member_id: memberId });
  const profile = profiles[0];
  if (!profile) return;

  const newXP = Math.max(0, (profile.total_xp || 0) - pointsToRevoke);
  const newCompletions = Math.max(0, (profile.total_completions || 0) - 1);

  await base44.entities.GamificationProfile.update(profile.id, {
    total_xp: newXP,
    level: getLevelInfo(newXP).level,
    total_completions: newCompletions,
  });
}

export async function awardPoints(task, isBlastRunning = false) {
  let memberId = task.assigned_to;
  let memberName = task.assigned_to_name;

  if (!memberId || !memberName) {
    const me = await base44.auth.me();
    if (!me) return null;
    memberId = me.id;
    memberName = me.full_name;
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dueDate = parseISO(task.next_due_date);
  const daysOverdue = differenceInDays(today, dueDate);
  const isOverdue = daysOverdue >= 3;
  const isDeep = (task.category || "").toLowerCase().includes("deep");
  const taskIsCleaning = isCleaning(task);
  const taskIsMaintenance = isMaintenance(task);
  const taskIsBill = isBill(task);

  let basePoints = getTaskPoints(task);
  const blastMultiplier = isBlastRunning ? 2 : 1;

  // Find or create profile
  const profiles = await base44.entities.GamificationProfile.filter({ family_member_id: memberId });
  let profile = profiles[0];

  if (!profile) {
    profile = await base44.entities.GamificationProfile.create({
      family_member_id: memberId,
      family_member_name: memberName,
      total_xp: 0,
      level: 1,
      badges: [],
      total_completions: 0,
      deep_cleaning_completions: 0,
      overdue_completions: 0,
      maintenance_completions: 0,
      bill_completions: 0,
      cleaning_streak: 0,
      last_cleaning_date: null,
      bill_months_ontime: 0,
      all_rounder_weeks: 0,
    });
  }

  // --- Streak bonuses ---
  let bonusPoints = 0;
  let newCleaningStreak = profile.cleaning_streak || 0;

  // Daily cleaning streak: +10 per day after 3 consecutive days
  if (taskIsCleaning) {
    const lastClean = profile.last_cleaning_date ? parseISO(profile.last_cleaning_date) : null;
    const daysSinceLastClean = lastClean ? differenceInDays(today, lastClean) : 999;
    if (daysSinceLastClean <= 1) {
      newCleaningStreak = newCleaningStreak + 1;
    } else {
      newCleaningStreak = 1;
    }
    if (newCleaningStreak > 3) {
      bonusPoints += 10; // +10 per day after 3 consecutive cleaning days
    }
  }

  const newMaintenance = (profile.maintenance_completions || 0) + (taskIsMaintenance ? 1 : 0);
  const newBillCompletions = (profile.bill_completions || 0) + (taskIsBill ? 1 : 0);

  // Maintenance Guru bonus: 200 points when hitting exactly 5
  const oldMaintenance = profile.maintenance_completions || 0;
  if (taskIsMaintenance && oldMaintenance < 5 && newMaintenance >= 5) {
    bonusPoints += 200;
  }

  const totalPoints = (basePoints * blastMultiplier) + bonusPoints;

  const oldLevel = getLevelInfo(profile.total_xp || 0);
  const newXP = (profile.total_xp || 0) + totalPoints;
  const newLevelInfo = getLevelInfo(newXP);
  const leveledUp = newLevelInfo.level > oldLevel.level;

  const updatedProfile = {
    ...profile,
    total_xp: newXP,
    level: newLevelInfo.level,
    total_completions: (profile.total_completions || 0) + 1,
    deep_cleaning_completions: (profile.deep_cleaning_completions || 0) + (isDeep ? 1 : 0),
    overdue_completions: (profile.overdue_completions || 0) + (isOverdue ? 1 : 0),
    maintenance_completions: newMaintenance,
    bill_completions: newBillCompletions,
    cleaning_streak: taskIsCleaning ? newCleaningStreak : (profile.cleaning_streak || 0),
    last_cleaning_date: taskIsCleaning ? todayStr : (profile.last_cleaning_date || null),
  };

  // Check new badges (including bonus XP badges)
  const newBadgeIds = checkNewBadges(updatedProfile);

  // Badge bonus points
  const BADGE_BONUS = {
    "bill_pay_pro": 300,
    "all_rounder": 500,
    "cleaning_streak_7": 100,
  };
  let badgeBonusXP = 0;
  newBadgeIds.forEach(id => {
    if (BADGE_BONUS[id]) badgeBonusXP += BADGE_BONUS[id];
  });

  updatedProfile.total_xp += badgeBonusXP;
  updatedProfile.badges = [...(profile.badges || []), ...newBadgeIds];

  await base44.entities.GamificationProfile.update(profile.id, {
    total_xp: updatedProfile.total_xp,
    level: getLevelInfo(updatedProfile.total_xp).level,
    badges: updatedProfile.badges,
    total_completions: updatedProfile.total_completions,
    deep_cleaning_completions: updatedProfile.deep_cleaning_completions,
    overdue_completions: updatedProfile.overdue_completions,
    maintenance_completions: updatedProfile.maintenance_completions,
    bill_completions: updatedProfile.bill_completions,
    cleaning_streak: updatedProfile.cleaning_streak,
    last_cleaning_date: updatedProfile.last_cleaning_date,
    family_member_name: memberName,
  });

  await base44.entities.CompletionHistory.create({
    family_member_id: memberId,
    family_member_name: memberName,
    task_id: task.id,
    task_name: task.name,
    points_earned: totalPoints + badgeBonusXP,
    completed_date: todayStr,
    is_overdue: isOverdue,
  });

  const newBadges = ACHIEVEMENT_BADGES
    .filter(b => newBadgeIds.includes(b.id))
    .map(b => `${b.emoji} ${b.name}`);

  return {
    points: basePoints,
    totalPoints: totalPoints + badgeBonusXP,
    bonusPoints: bonusPoints + badgeBonusXP,
    leveledUp,
    newLevel: getLevelInfo(updatedProfile.total_xp).title,
    newBadges,
    blastBonus: isBlastRunning,
    cleaningStreak: updatedProfile.cleaning_streak,
  };
}