import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get full user record from DB to get family_group_id and account_type
    const userRecords = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const rawUser = userRecords[0];
    // Flatten data fields onto top level for easy access
    const fullUser = rawUser ? { ...rawUser, ...(rawUser.data || {}) } : null;
    const familyGroupId = fullUser?.family_group_id;
    const accountType = fullUser?.account_type;

    // Solo user: return just their own profile
    if (!familyGroupId || accountType === 'solo') {
      const soloProfiles = await base44.asServiceRole.entities.GamificationProfile.filter({ family_member_id: user.id });
      return Response.json({ profiles: soloProfiles, members: [], users: [], solo: true, currentUser: fullUser });
    }

    // Family user: fetch members + profiles for the family group
    const [members, profiles] = await Promise.all([
      base44.asServiceRole.entities.FamilyMember.filter({ family_group_id: familyGroupId }),
      base44.asServiceRole.entities.GamificationProfile.filter({ family_group_id: familyGroupId }),
    ]);

    // Also include profiles matched by member id in case family_group_id isn't set on profile
    const memberIds = members.map(m => m.id);
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.filter({});
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
      currentUser: fullUser
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});