import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyGroupId = user.family_group_id;

    if (!familyGroupId) {
      return Response.json({ profiles: [], members: [], solo: true, currentUser: user });
    }

    // Fetch live data
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list('', 5000);
    const familyMembers = allMembers.filter(m => m.family_group_id === familyGroupId);

    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list('-total_xp', 5000);
    const familyProfiles = allProfiles.filter(p => p.family_group_id === familyGroupId);

    return Response.json({
      profiles: familyProfiles,
      members: familyMembers,
      solo: false,
      currentUser: { ...user, family_group_id: familyGroupId }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});