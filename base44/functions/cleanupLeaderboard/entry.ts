import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get all members for this family
    const members = await base44.asServiceRole.entities.FamilyMember.filter({
      family_group_id: user.family_group_id
    });
    const memberIds = new Set(members.map(m => m.id));

    // Get all profiles
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list();

    const results = [];
    const deleted = [];

    // Delete profiles for members that don't exist
    for (const profile of allProfiles) {
      if (!memberIds.has(profile.family_member_id)) {
        await base44.asServiceRole.entities.GamificationProfile.delete(profile.id);
        deleted.push({ profile_id: profile.id, member_id: profile.family_member_id, member_name: profile.family_member_name });
      }
    }

    // Consolidate duplicate profiles per member
    for (const member of members) {
      const memberProfiles = await base44.asServiceRole.entities.GamificationProfile.filter({
        family_member_id: member.id
      });

      if (memberProfiles.length > 1) {
        const [first, ...dupes] = memberProfiles;
        for (const dupe of dupes) {
          await base44.asServiceRole.entities.GamificationProfile.delete(dupe.id);
          deleted.push({ profile_id: dupe.id, member_id: member.id, member_name: member.name });
        }
        results.push({ member_name: member.name, action: "consolidated", kept_profile: first.id });
      }
    }

    return Response.json({ success: true, deleted_count: deleted.length, deleted, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});