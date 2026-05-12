import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list('-total_xp', 1000);
    const withKelly = allProfiles.filter(p => p.family_member_name?.includes('Kelly'));
    return Response.json({ 
      total_count: allProfiles.length,
      kelly_profiles: withKelly.map(p => ({
        id: p.id,
        name: p.family_member_name,
        xp: p.total_xp,
        member_id: p.family_member_id,
        full: p
      })),
      all_profiles: allProfiles.slice(0, 20).map(p => ({
        id: p.id,
        name: p.family_member_name,
        xp: p.total_xp
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});