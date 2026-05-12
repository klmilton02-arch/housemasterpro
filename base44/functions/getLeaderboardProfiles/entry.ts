import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Always use fresh DB user — auth token can be stale for non-owner family members
    const allUsers = await base44.asServiceRole.entities.User.list();
    const freshUser = allUsers.find(u => u.email === user.email) || user;
    let familyGroupId = freshUser.family_group_id || null;

    // Check if user owns a group
    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      familyGroupId = ownedGroup?.id || null;
    }

    // If still no family group, check FamilyMember records linked to this user
    // This handles stale tokens for non-owner members like Scarlett
    if (!familyGroupId) {
      // Use user-scoped call first (works via RLS if any member record is visible)
      let allMembers = [];
      try {
        allMembers = await base44.entities.FamilyMember.list();
      } catch (_) {}
      
      // Also try service role in case user-scoped returns nothing due to stale token
      if (allMembers.length === 0) {
        allMembers = await base44.asServiceRole.entities.FamilyMember.list();
      }
      
      const match = allMembers.find(m =>
        m.linked_user_email?.toLowerCase() === user.email?.toLowerCase() ||
        m.linked_user_id === user.id
      );
      if (match?.family_group_id) {
        familyGroupId = match.family_group_id;
        // Patch the user record so future calls work correctly
        await base44.asServiceRole.entities.User.update(freshUser.id, {
          family_group_id: familyGroupId,
          account_type: 'family',
        });
        freshUser.family_group_id = familyGroupId;
        freshUser.account_type = 'family';
      }
    }

    const accountType = freshUser.account_type;

    // Solo user: return just their own profile
    if (!familyGroupId || accountType === 'solo') {
      const soloProfiles = await base44.entities.GamificationProfile.list();
      return Response.json({ profiles: soloProfiles, members: [], users: [], solo: true, currentUser: freshUser });
    }

    // For family: fetch all data and filter by family_group_id in JS
    // Don't rely on RLS for GamificationProfile since user tokens may be stale
    let members = [];
    let allProfiles = [];

    try {
      [members, allProfiles] = await Promise.all([
        base44.entities.FamilyMember.list(),
        base44.entities.GamificationProfile.list(),
      ]);
    } catch (_) {}

    // If user-scoped returned nothing, use service role
    if (members.length === 0) {
      const srMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
      members = srMembers.filter(m => m.family_group_id === familyGroupId);
    } else {
      members = members.filter(m => m.family_group_id === familyGroupId);
    }

    const memberIds = new Set(members.map(m => m.id));

    // Always use service role for profiles to bypass RLS (ensures all family members see each other's XP)
    if (allProfiles.length === 0 || allProfiles.every(p => !p.family_group_id)) {
      const srProfiles = await base44.asServiceRole.entities.GamificationProfile.list('-total_xp', 500);
      allProfiles = srProfiles.filter(p => p.family_group_id === familyGroupId || memberIds.has(p.family_member_id));
    } else {
      allProfiles = allProfiles.filter(p => p.family_group_id === familyGroupId || memberIds.has(p.family_member_id));
    }

    // Dedupe: one profile per family_member_id, keeping the one with most XP
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
      currentUser: { ...freshUser, family_group_id: familyGroupId }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});