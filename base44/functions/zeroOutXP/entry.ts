import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profiles = await base44.asServiceRole.entities.GamificationProfile.filter({
      family_member_name: user.full_name
    });

    let updated = 0;
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
        all_rounder_weeks: 0
      });
      updated++;
    }

    console.log(`[zeroOutXP] Reset ${updated} profiles for ${user.full_name}`);
    return Response.json({ updated });
  } catch (error) {
    console.error('[zeroOutXP] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});