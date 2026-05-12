import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetName = body.name || user.full_name;
    const targetId = body.id || user.id;

    // Get all profiles and find matches
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list('-created_date', 5000);
    const targetNameLower = targetName?.toLowerCase() || '';
    const profiles = allProfiles.filter(p => {
      const profileNameLower = p.family_member_name?.toLowerCase() || '';
      // Match if exact or if profile name contains target name parts
      return profileNameLower === targetNameLower || 
             targetNameLower.includes(profileNameLower) ||
             profileNameLower.includes(targetNameLower) ||
             p.family_member_id === targetId;
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