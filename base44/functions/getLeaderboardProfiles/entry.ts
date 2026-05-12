import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Always use fresh DB user
    const allUsers = await base44.asServiceRole.entities.User.list();
    const freshUser = allUsers.find(u => u.email === user.email) || user;
    let familyGroupId = freshUser.family_group_id || null;

    // Check if user owns a group
    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      familyGroupId = ownedGroup?.id || null;
    }

    // If still no family group, check FamilyMember records
    if (!familyGroupId) {
      const allMembers = await base44.asServiceRole.entities.FamilyMember.list();
      const match = allMembers.find(m =>
        m.linked_user_email?.toLowerCase() === user.email?.toLowerCase() ||
        m.linked_user_id === user.id
      );
      if (match?.family_group_id) {
        familyGroupId = match.family_group_id;
        // Patch user for future calls
        await base44.asServiceRole.entities.User.update(freshUser.id, {
          family_group_id: familyGroupId,
          account_type: 'family',
        });
      }
    }

    const accountType = freshUser.account_type;

    // Solo user: return just their own profiles
    if (!familyGroupId || accountType === 'solo') {
      const soloProfiles = await base44.asServiceRole.entities.GamificationProfile.list();
      const userMember = soloProfiles.find(p => p.family_member_id === freshUser.id);
      const filtered = userMember ? [userMember] : soloProfiles;
      return Response.json({ profiles: filtered, members: [], users: [], solo: true, currentUser: freshUser });
    }

    // Family user: fetch all data using service role ONLY
    const [members, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.FamilyMember.list('-created_date', 500),
      base44.asServiceRole.entities.GamificationProfile.list('-total_xp', 500),
    ]);

    // Filter to family group
    const familyMembers = members.filter(m => m.family_group_id === familyGroupId);
    const memberIds = new Set(familyMembers.map(m => m.id));

    // Filter profiles: MUST have the correct family_group_id AND a matching member ID
    const familyProfiles = allProfiles.filter(p => 
      p.family_group_id === familyGroupId && memberIds.has(p.family_member_id)
    );

    // Dedupe: one profile per family_member_id, keeping the one with most XP
    const profileMap = {};
    for (const p of familyProfiles) {
      const key = p.family_member_id;
      if (!profileMap[key] || (p.total_xp || 0) > (profileMap[key].total_xp || 0)) {
        profileMap[key] = p;
      }
    }
    const profiles = Object.values(profileMap);

    return Response.json({
      profiles,
      members: familyMembers,
      users: [],
      solo: false,
      currentUser: { ...freshUser, family_group_id: familyGroupId }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});