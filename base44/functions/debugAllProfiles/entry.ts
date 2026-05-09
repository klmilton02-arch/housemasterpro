import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Raw list of all profiles
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list();

    const grouped = {};
    for (const p of allProfiles) {
      const key = `${p.family_member_id}|${p.family_member_name}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push({ id: p.id, xp: p.total_xp, created: p.created_date });
    }

    return Response.json({
      total: allProfiles.length,
      grouped,
      all: allProfiles
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});