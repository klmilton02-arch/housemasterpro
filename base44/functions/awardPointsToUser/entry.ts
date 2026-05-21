import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DIFFICULTY_POINTS = { "Trivial": 1, "Easy": 2, "Medium": 3, "Hard": 4, "Very Hard": 5 };
const LEVELS = [
  { level: 1, minXP: 0 }, { level: 2, minXP: 50 }, { level: 3, minXP: 150 },
  { level: 4, minXP: 300 }, { level: 5, minXP: 500 }, { level: 6, minXP: 750 },
  { level: 7, minXP: 1100 }, { level: 8, minXP: 1500 }, { level: 9, minXP: 2000 },
  { level: 10, minXP: 2700 },
];

function getLevelInfo(xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) { if (xp >= lvl.minXP) current = lvl; }
  return current;
}

function getTaskPoints(task) { return DIFFICULTY_POINTS[task.difficulty] ?? 2; }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { target_user_id, target_user_email, target_name, task, isBlastRunning, family_group_id } = body;

    if (!task) return Response.json({ error: 'task is required' }, { status: 400 });

    // Resolve the target user ID from the FamilyMember's linked_user_id (passed directly)
    // or fall back to finding GamificationProfile by family_member_name
    let userId = target_user_id;
    let userName = target_name;

    // If no userId but we have an email, look up the FamilyMember with that linked_user_email
    // to get their linked_user_id
    if (!userId && target_user_email) {
      const members = await base44.asServiceRole.entities.FamilyMember.filter({ linked_user_email: target_user_email });
      if (members.length > 0 && members[0].linked_user_id) {
        userId = members[0].linked_user_id;
        if (!userName) userName = members[0].name;
      }
    }

    // Last resort: find profile by family_member_name
    if (!userId && userName) {
      const profiles = await base44.asServiceRole.entities.GamificationProfile.filter({ family_member_name: userName });
      if (profiles.length > 0 && profiles[0].user_id) {
        userId = profiles[0].user_id;
      }
    }

    if (!userId) return Response.json({ error: 'Could not resolve target user' }, { status: 400 });

    const todayStr = new Date().toISOString().split("T")[0];
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const taskIsCleaning = (task.category || "").toLowerCase().includes("cleaning");
    const taskIsMaintenance = (task.category || "").toLowerCase().includes("maintenance");
    const taskIsBill = (task.category || "").toLowerCase().includes("bill");
    const isDeep = (task.category || "").toLowerCase().includes("deep");

    const dueDate = task.next_due_date ? new Date(task.next_due_date) : today;
    const daysOverdue = Math.floor((today - dueDate) / 86400000);
    const isOverdue = daysOverdue >= 3;

    let basePoints = getTaskPoints(task);
    const blastMultiplier = isBlastRunning ? 2 : 1;

    // Find or create profile for the target user
    const profileResults = await base44.asServiceRole.entities.GamificationProfile.filter({ user_id: userId });
    let profile = profileResults[0];

    if (!profile) {
      profile = await base44.asServiceRole.entities.GamificationProfile.create({
        user_id: userId,
        family_member_name: userName || "Unknown",
        family_group_id: family_group_id || undefined,
        total_xp: 0, level: 1, badges: [], total_completions: 0,
      });
    }

    // Streak
    let bonusPoints = 0;
    let newCleaningStreak = profile.cleaning_streak || 0;
    if (taskIsCleaning) {
      const lastClean = profile.last_cleaning_date ? new Date(profile.last_cleaning_date) : null;
      const daysSince = lastClean ? Math.floor((today - lastClean) / 86400000) : 999;
      newCleaningStreak = daysSince <= 1 ? newCleaningStreak + 1 : 1;
      if (newCleaningStreak > 3) bonusPoints += 10;
    }

    const newMaintenance = (profile.maintenance_completions || 0) + (taskIsMaintenance ? 1 : 0);
    const oldMaintenance = profile.maintenance_completions || 0;
    if (taskIsMaintenance && oldMaintenance < 5 && newMaintenance >= 5) bonusPoints += 200;

    const totalPoints = (basePoints * blastMultiplier) + bonusPoints;
    const newXP = (profile.total_xp || 0) + totalPoints;
    const newLevelInfo = getLevelInfo(newXP);

    await base44.asServiceRole.entities.GamificationProfile.update(profile.id, {
      total_xp: newXP,
      level: newLevelInfo.level,
      total_completions: (profile.total_completions || 0) + 1,
      deep_cleaning_completions: (profile.deep_cleaning_completions || 0) + (isDeep ? 1 : 0),
      overdue_completions: (profile.overdue_completions || 0) + (isOverdue ? 1 : 0),
      maintenance_completions: newMaintenance,
      bill_completions: (profile.bill_completions || 0) + (taskIsBill ? 1 : 0),
      cleaning_streak: taskIsCleaning ? newCleaningStreak : (profile.cleaning_streak || 0),
      last_cleaning_date: taskIsCleaning ? todayStr : (profile.last_cleaning_date || null),
      family_member_name: profile.family_member_name || userName,
      family_group_id: family_group_id || profile.family_group_id || undefined,
    });

    await base44.asServiceRole.entities.CompletionHistory.create({
      family_member_id: userId,
      family_member_name: userName || profile.family_member_name,
      task_id: task.id,
      task_name: task.name,
      points_earned: totalPoints,
      completed_date: todayStr,
      is_overdue: isOverdue,
    });

    return Response.json({ success: true, xp_awarded: totalPoints, new_total_xp: newXP });
  } catch (error) {
    console.error('[awardPointsToUser] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});