import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all tasks in parallel batches
    let hasMore = true;
    while (hasMore) {
      let tasks;
      if (user.family_group_id) {
        tasks = await base44.asServiceRole.entities.Task.filter({ family_group_id: user.family_group_id }, "-created_date", 50);
      } else {
        tasks = await base44.asServiceRole.entities.Task.filter({ created_by: user.email }, "-created_date", 50);
      }

      if (tasks.length === 0) {
        hasMore = false;
      } else {
        await Promise.all(tasks.map(t => base44.asServiceRole.entities.Task.delete(t.id)));
        if (tasks.length < 50) hasMore = false;
      }
    }

    // Delete completion history in parallel
    const allHistory = await base44.asServiceRole.entities.CompletionHistory.list("-created_date", 1000);
    const historyToDelete = allHistory.filter(h =>
      h.created_by === user.email ||
      h.family_member_id === user.id ||
      h.family_member_name === user.full_name
    );
    if (historyToDelete.length > 0) {
      await Promise.all(historyToDelete.map(h => base44.asServiceRole.entities.CompletionHistory.delete(h.id)));
    }

    // Reset gamification profiles
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list("-created_date", 100);
    const userProfiles = allProfiles.filter(p =>
      p.family_member_name === user.full_name ||
      p.family_member_id === user.id ||
      p.created_by === user.email
    );

    const resetData = {
      total_xp: 0, level: 1, badges: [], total_completions: 0,
      deep_cleaning_completions: 0, overdue_completions: 0,
      maintenance_completions: 0, bill_completions: 0,
      cleaning_streak: 0, last_cleaning_date: null,
      bill_months_ontime: 0, all_rounder_weeks: 0,
    };

    if (userProfiles.length > 0) {
      await Promise.all(userProfiles.map(p =>
        base44.asServiceRole.entities.GamificationProfile.update(p.id, resetData)
      ));
    }

    return Response.json({ success: true, message: 'All data reset' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});