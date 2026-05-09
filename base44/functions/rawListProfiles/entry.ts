import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Use filter with empty query to bypass caching
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.filter({});
    
    // Group by member
    const byMember = {};
    for (const p of allProfiles) {
      if (!byMember[p.family_member_id]) {
        byMember[p.family_member_id] = [];
      }
      byMember[p.family_member_id].push(p.id);
    }

    return Response.json({
      total: allProfiles.length,
      byMember,
      all: allProfiles.map(p => ({
        id: p.id,
        member_id: p.family_member_id,
        member_name: p.family_member_name,
        xp: p.total_xp,
        created: p.created_date
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});