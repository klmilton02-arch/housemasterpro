import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Reset all gamification profiles only (deletion is slow, reset is faster)
    const profiles = await base44.asServiceRole.entities.GamificationProfile.list();
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
        last_cleaning_date: null,
        bill_months_ontime: 0,
        all_rounder_weeks: 0,
      });
    }

    // Delete all completion history records
    const allHistory = await base44.asServiceRole.entities.CompletionHistory.list();
    for (const entry of allHistory) {
      await base44.asServiceRole.entities.CompletionHistory.delete(entry.id);
    }

    return Response.json({ 
      success: true, 
      message: 'Gamification reset and completion history cleared. Please delete tasks manually from the dashboard.' 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});