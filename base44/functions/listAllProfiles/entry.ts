import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list('-total_xp', 5000);
    
    return Response.json({
      total: allProfiles.length,
      profiles: allProfiles.map(p => ({
        id: p.id,
        name: p.family_member_name,
        xp: p.total_xp,
        member_id: p.family_member_id,
        family_group_id: p.family_group_id
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});