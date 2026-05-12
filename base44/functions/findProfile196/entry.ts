import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // List with NO filter  - get absolutely everything
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list('-total_xp', 10000);
    
    const profile196 = allProfiles.find(p => p.total_xp === 196);
    
    if (profile196) {
      return Response.json({
        found: true,
        profile: {
          id: profile196.id,
          name: profile196.family_member_name,
          xp: profile196.total_xp,
          member_id: profile196.family_member_id,
          family_group_id: profile196.family_group_id,
          created_date: profile196.created_date,
          updated_date: profile196.updated_date
        }
      });
    }
    
    return Response.json({
      found: false,
      all_profiles: allProfiles.map(p => ({ id: p.id, name: p.family_member_name, xp: p.total_xp }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});