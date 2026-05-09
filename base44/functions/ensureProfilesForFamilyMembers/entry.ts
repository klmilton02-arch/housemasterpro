import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get family group from current user
    const familyGroupId = user.family_group_id;

    if (!familyGroupId) {
      return Response.json({ error: 'No family group found' }, { status: 400 });
    }

    // Get all family members in the group
    const members = await base44.asServiceRole.entities.FamilyMember.filter({ family_group_id: familyGroupId });

    // Get existing profiles
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.filter({});
    const existingMemberIds = new Set(allProfiles.map(p => p.family_member_id));

    // Create missing profiles (use user-scoped creation since RLS requires family_member_id match)
    const created = [];
    for (const member of members) {
      if (!existingMemberIds.has(member.id)) {
        try {
          const newProfile = await base44.entities.GamificationProfile.create({
            family_group_id: familyGroupId,
            family_member_id: member.id,
            family_member_name: member.name,
            total_xp: 0,
            level: 1,
            badges: [],
            total_completions: 0
          });
          created.push({ member_id: member.id, member_name: member.name, profile_id: newProfile.id });
        } catch (e) {
          // If user can't create for this member, skip
        }
      }
    }

    return Response.json({
      success: true,
      message: `Created ${created.length} profiles`,
      created
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});