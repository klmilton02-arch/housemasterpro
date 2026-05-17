import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyGroupId = user.family_group_id || null;

    // Get profiles — if in a family, get all family profiles; otherwise just own
    let profiles = [];
    let familyUsers = [];

    if (familyGroupId) {
      // Get all users in the same family group (service role needed to list users)
      const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 200);
      familyUsers = allUsers.filter(u => u.family_group_id === familyGroupId);

      // Get all gamification profiles for this family group
      profiles = await base44.entities.GamificationProfile.filter({ family_group_id: familyGroupId }, '-total_xp', 100);

      // Also ensure current user's own profile is included (in case family_group_id was recently set)
      const myProfile = profiles.find(p => p.user_id === user.id);
      if (!myProfile) {
        const ownProfiles = await base44.entities.GamificationProfile.filter({ user_id: user.id });
        if (ownProfiles[0]) profiles.push(ownProfiles[0]);
      }
    } else {
      // Solo user — just their own profile
      profiles = await base44.entities.GamificationProfile.filter({ user_id: user.id });
    }

    return Response.json({
      profiles,
      familyUsers,
      currentUser: user,
      solo: !familyGroupId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});