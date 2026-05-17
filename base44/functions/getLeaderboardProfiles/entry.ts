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

    // Both queries can now use user-scoped access since RLS is family_group_id based
    const [members, profiles] = await Promise.all([
      base44.asServiceRole.entities.FamilyMember.filter({ family_group_id: familyGroupId }),
      base44.entities.GamificationProfile.filter({ family_group_id: familyGroupId }, '-total_xp', 100)
    ]);

    return Response.json({
      profiles,
      members,
      solo: false,
      currentUser: { ...user, family_group_id: familyGroupId }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});