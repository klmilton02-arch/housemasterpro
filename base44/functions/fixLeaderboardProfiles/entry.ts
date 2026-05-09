import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get all family members and gamification profiles
    const members = await base44.asServiceRole.entities.FamilyMember.filter({
      family_group_id: user.family_group_id
    });

    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list();
    const results = [];

    // For each family member, consolidate to one profile
    for (const member of members) {
      const memberProfiles = allProfiles.filter(p => p.family_member_id === member.id);
      
      if (memberProfiles.length > 1) {
        // Keep first, delete rest
        const [first, ...dupes] = memberProfiles;
        for (const dupe of dupes) {
          await base44.asServiceRole.entities.GamificationProfile.delete(dupe.id);
        }
        results.push({ member: member.name, action: "consolidated", kept: first.id, deleted: dupes.length });
      } else if (memberProfiles.length === 1) {
        results.push({ member: member.name, action: "ok", profile_id: memberProfiles[0].id });
      } else {
        results.push({ member: member.name, action: "no_profile" });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});