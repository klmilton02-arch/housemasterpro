import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyGroupId = user.family_group_id;
    if (!familyGroupId) {
      return Response.json({ error: 'No family group found' }, { status: 400 });
    }

    // Delete all tasks for this family group
    const allTasks = await base44.asServiceRole.entities.Task.list('', 10000);
    const tasksToDelete = allTasks.filter(t => t.family_group_id === familyGroupId);
    
    for (const task of tasksToDelete) {
      await base44.asServiceRole.entities.Task.delete(task.id);
    }

    // Reset all gamification profiles to default values
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list('', 10000);
    const profilesToReset = allProfiles.filter(p => p.family_group_id === familyGroupId);
    
    for (const profile of profilesToReset) {
      await base44.asServiceRole.entities.GamificationProfile.update(profile.id, {
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
        all_rounder_weeks: 0
      });
    }

    return Response.json({
      success: true,
      tasksDeleted: tasksToDelete.length,
      profilesReset: profilesToReset.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});