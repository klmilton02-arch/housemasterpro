import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyGroupId = user.family_group_id;
    const accountType = user.account_type;

    // Solo user: return just their own profile
    if (!familyGroupId || accountType === 'solo') {
      const soloProfiles = await base44.asServiceRole.entities.GamificationProfile.filter({ family_member_id: user.id });
      return Response.json({ profiles: soloProfiles, members: [], users: [], solo: true, currentUser: user });
    }

    // Family user: fetch members + all profiles, then filter by family
    const [members, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.FamilyMember.filter({ family_group_id: familyGroupId }),
      base44.asServiceRole.entities.GamificationProfile.filter({}),
    ]);

    const memberIds = members.map(m => m.id);
    const familyProfiles = allProfiles.filter(p =>
      p.family_group_id === familyGroupId ||
      memberIds.includes(p.family_member_id) ||
      members.some(m => m.linked_user_id && p.family_member_id === m.linked_user_id)
    );

    return Response.json({
      profiles: familyProfiles,
      members,
      users: [],
      solo: false,
      currentUser: user
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});