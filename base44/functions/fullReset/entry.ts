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

    // Get all tasks in the family group
    const tasks = await base44.asServiceRole.entities.Task.filter({ family_group_id: familyGroupId });

    // Delete calendar events and tasks
    for (const task of tasks) {
      if (task.calendar_event_id) {
        try {
          await base44.functions.invoke('deleteCalendarEvent', { taskId: task.id });
        } catch (e) {
          console.error(`Failed to delete calendar event for task ${task.id}:`, e);
        }
      }
    }

    // Delete all tasks
    for (const task of tasks) {
      await base44.asServiceRole.entities.Task.delete(task.id);
    }

    // Reset all gamification profiles
    const profiles = await base44.asServiceRole.entities.GamificationProfile.filter({ family_group_id: familyGroupId });
    for (const profile of profiles) {
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
        bill_months_ontime: 0,
        all_rounder_weeks: 0,
      });
    }

    // Delete completion history
    const history = await base44.asServiceRole.entities.CompletionHistory.filter({ family_group_id: familyGroupId });
    for (const entry of history) {
      await base44.asServiceRole.entities.CompletionHistory.delete(entry.id);
    }

    return Response.json({ success: true, message: 'Full reset completed' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});