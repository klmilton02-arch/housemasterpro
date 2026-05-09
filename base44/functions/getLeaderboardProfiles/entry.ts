import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get family group ID from current user
    const currentUser = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const familyGroupId = currentUser[0]?.family_group_id;

    if (!familyGroupId) {
      return Response.json({ profiles: [], members: [], users: [] });
    }

    // Fetch fresh data
    const [members, profiles, allUsers] = await Promise.all([
      base44.asServiceRole.entities.FamilyMember.filter({ family_group_id: familyGroupId }),
      base44.asServiceRole.entities.GamificationProfile.filter({}),
      base44.asServiceRole.entities.User.list()
    ]);

    // Filter profiles for this family group only
    const familyProfiles = profiles.filter(p => {
      const member = members.find(m => m.id === p.family_member_id);
      return member && member.family_group_id === familyGroupId;
    });

    return Response.json({
      profiles: familyProfiles,
      members,
      users: allUsers || []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});