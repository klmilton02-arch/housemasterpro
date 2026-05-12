import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountType = user.account_type;

    // Determine the real family group ID (user record may be stale)
    let familyGroupId = user.family_group_id;
    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      familyGroupId = ownedGroup?.id || null;
    }

    // Solo user: return just their own profile
    if (!familyGroupId || accountType === 'solo') {
      const soloProfiles = await base44.asServiceRole.entities.GamificationProfile.filter({ family_member_id: user.id });
      return Response.json({ profiles: soloProfiles, members: [], users: [], solo: true, currentUser: user });
    }

    // Family user: use user-scoped API (respects RLS, returns accessible records)
    const [members, allProfiles] = await Promise.all([
      base44.entities.FamilyMember.list(),
      base44.entities.GamificationProfile.list(),
    ]);

    // Dedupe profiles: one per family_member_id, keeping the one with most XP
    const profileMap = {};
    for (const p of allProfiles) {
      const key = p.family_member_id;
      if (!profileMap[key] || (p.total_xp || 0) > (profileMap[key].total_xp || 0)) {
        profileMap[key] = p;
      }
    }
    const profiles = Object.values(profileMap);

    return Response.json({
      profiles,
      members,
      users: [],
      solo: false,
      currentUser: { ...user, family_group_id: familyGroupId }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});