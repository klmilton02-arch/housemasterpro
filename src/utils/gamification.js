import { base44 } from "@/api/base44Client";
import { parseISO, differenceInDays } from "date-fns";

const TASK_POINTS = {
  "Vacuum Carpet": 5,
  "Mop Hard Floors": 6,
  "Refrigerator Cleaning": 10,
  "Bathroom Cleaning": 7,
  "Dust Furniture": 4,
  "Deep Clean Carpets": 20,
  "Oven Deep Cleaning": 18,
  "Grout Cleaning": 15,
  "Fireplace Cleaning": 25,
};

export const LEVELS = [
  { level: 1, minXP: 0, title: "Novice Cleaner" },
  { level: 2, minXP: 50, title: "Cleaning Helper" },
  { level: 3, minXP: 150, title: "Home Maintainer" },
  { level: 4, minXP: 300, title: "Cleaning Pro" },
  { level: 5, minXP: 500, title: "Household Hero" },
];

export const ACHIEVEMENT_BADGES = [
  { id: "starter", name: "Starter", emoji: "⭐", check: (p) => p.total_completions >= 1 },
  { id: "task_master", name: "Task Master", emoji: "🏆", check: (p) => p.total_completions >= 10 },
  { id: "deep_cleaner", name: "Deep Cleaner", emoji: "🧹", check: (p) => p.deep_cleaning_completions >= 3 },
  { id: "overdue_fighter", name: "Overdue Fighter", emoji: "⚡", check: (p) => p.overdue_completions >= 5 },
];

export function getTaskPoints(task) {
  return TASK_POINTS[task.name] ?? (task.task_type === "Deep Cleaning" ? 15 : 5);
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

function checkNewBadges(profile) {
  const earned = profile.badges || [];
  return ACHIEVEMENT_BADGES
    .filter(b => !earned.includes(b.id) && b.check(profile))
    .map(b => b.id);
}

export async function awardPoints(task) {
  // Use assigned member, or fall back to the logged-in user
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
  const isDeep = task.task_type === "Deep Cleaning";

  const basePoints = getTaskPoints(task);
  const isBlastActive = localStorage.getItem("blast_mode_active") === "true";
  const blastMultiplier = isBlastActive ? 2 : 1;
  const totalPoints = basePoints * blastMultiplier;

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
    });
  }

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
  };

  const newBadgeIds = checkNewBadges(updatedProfile);
  updatedProfile.badges = [...(profile.badges || []), ...newBadgeIds];

  await base44.entities.GamificationProfile.update(profile.id, {
    total_xp: updatedProfile.total_xp,
    level: updatedProfile.level,
    badges: updatedProfile.badges,
    total_completions: updatedProfile.total_completions,
    deep_cleaning_completions: updatedProfile.deep_cleaning_completions,
    overdue_completions: updatedProfile.overdue_completions,
    family_member_name: memberName,
  });

  await base44.entities.CompletionHistory.create({
    family_member_id: memberId,
    family_member_name: memberName,
    task_id: task.id,
    task_name: task.name,
    points_earned: totalPoints,
    completed_date: todayStr,
    is_overdue: isOverdue,
  });

  const newBadges = ACHIEVEMENT_BADGES
    .filter(b => newBadgeIds.includes(b.id))
    .map(b => `${b.emoji} ${b.name}`);

  return { points: basePoints, totalPoints, leveledUp, newLevel: newLevelInfo.title, newBadges, blastBonus: isBlastActive };
}