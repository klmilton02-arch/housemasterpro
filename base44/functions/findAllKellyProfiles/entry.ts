import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get ALL profiles without limit
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list('-total_xp', 5000);
    
    const kellyProfiles = allProfiles.filter(p => p.family_member_name?.toLowerCase() === 'kelly');
    
    return Response.json({
      total_kelly_profiles: kellyProfiles.length,
      kelly_profiles: kellyProfiles.map(p => ({
        id: p.id,
        name: p.family_member_name,
        xp: p.total_xp,
        level: p.level,
        family_group_id: p.family_group_id,
        family_member_id: p.family_member_id,
        completions: p.total_completions,
        created_date: p.created_date
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});