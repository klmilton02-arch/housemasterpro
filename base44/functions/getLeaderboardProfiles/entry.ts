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

    // Family user: use user-scoped API (respects RLS, returns accessible records)
    const [members, profiles] = await Promise.all([
      base44.entities.FamilyMember.list(),
      base44.entities.GamificationProfile.list(),
    ]);

    return Response.json({
      profiles,
      members,
      users: [],
      solo: false,
      currentUser: user
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});