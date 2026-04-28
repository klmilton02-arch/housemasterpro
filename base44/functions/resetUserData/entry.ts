import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all tasks for this user's family group (in batches with delays)
    let hasMore = true;
    while (hasMore) {
      const tasks = await base44.asServiceRole.entities.Task.filter({ family_group_id: user.family_group_id }, "-created_date", 20);
      if (tasks.length === 0) {
        hasMore = false;
      } else {
        for (const task of tasks) {
          await base44.asServiceRole.entities.Task.delete(task.id);
        }
        // Longer delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Delete completion history for this user
    const allHistory = await base44.asServiceRole.entities.CompletionHistory.list("-created_date", 1000);
    const historyToDelete = allHistory.filter(h => h.created_by === user.email);
    
    for (let i = 0; i < historyToDelete.length; i += 10) {
      const batch = historyToDelete.slice(i, i + 10);
      await Promise.all(batch.map(h => base44.asServiceRole.entities.CompletionHistory.delete(h.id)));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Reset gamification profile for this user
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list("-created_date", 1000);
    const userProfiles = allProfiles.filter(p => p.family_member_name === user.full_name);
    
    for (const profile of userProfiles) {
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
        all_rounder_weeks: 0,
      });
    }

    return Response.json({ success: true, message: 'All data reset' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});