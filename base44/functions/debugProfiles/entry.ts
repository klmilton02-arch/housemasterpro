import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const members = await base44.asServiceRole.entities.FamilyMember.filter({
      family_group_id: user.family_group_id
    });

    const profiles = await base44.asServiceRole.entities.GamificationProfile.list();

    const memberMap = {};
    for (const member of members) {
      memberMap[member.id] = member.name;
    }

    const profilesByMember = {};
    for (const profile of profiles) {
      if (!profilesByMember[profile.family_member_id]) {
        profilesByMember[profile.family_member_id] = [];
      }
      profilesByMember[profile.family_member_id].push({
        id: profile.id,
        name: profile.family_member_name,
        xp: profile.total_xp
      });
    }

    return Response.json({
      total_members: members.length,
      total_profiles: profiles.length,
      members: members.map(m => ({ id: m.id, name: m.name })),
      profilesByMember,
      orphaned: profiles.filter(p => !memberMap[p.family_member_id])
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});