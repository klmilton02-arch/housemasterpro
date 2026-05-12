import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Manually do the same logic as getLeaderboardProfiles
    const allUsers = await base44.asServiceRole.entities.User.list();
    const freshUser = allUsers.find(u => u.email === user.email) || user;
    let familyGroupId = freshUser.family_group_id || null;

    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      familyGroupId = ownedGroup?.id || null;
    }

    if (!familyGroupId) {
      let allMembers = [];
      try {
        allMembers = await base44.entities.FamilyMember.list();
      } catch (_) {}
      
      if (allMembers.length === 0) {
        allMembers = await base44.asServiceRole.entities.FamilyMember.list();
      }
      
      const match = allMembers.find(m =>
        m.linked_user_email?.toLowerCase() === user.email?.toLowerCase() ||
        m.linked_user_id === user.id
      );
      if (match?.family_group_id) {
        familyGroupId = match.family_group_id;
      }
    }

    console.log('familyGroupId:', familyGroupId);

    let members = [];
    let allProfiles = [];

    try {
      [members, allProfiles] = await Promise.all([
        base44.entities.FamilyMember.list(),
        base44.entities.GamificationProfile.list(),
      ]);
    } catch (_) {}

    console.log('user-scoped profiles:', allProfiles.length, allProfiles.map(p => ({ name: p.family_member_name, xp: p.total_xp })));

    if (members.length === 0) {
      const srMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
      members = srMembers.filter(m => m.family_group_id === familyGroupId);
    } else {
      members = members.filter(m => m.family_group_id === familyGroupId);
    }

    const memberIds = new Set(members.map(m => m.id));

    if (allProfiles.length === 0 || allProfiles.every(p => !p.family_group_id)) {
      console.log('Fetching service role profiles...');
      const srProfiles = await base44.asServiceRole.entities.GamificationProfile.list('-total_xp', 500);
      console.log('sr profiles:', srProfiles.length, srProfiles.map(p => ({ name: p.family_member_name, xp: p.total_xp, fgid: p.family_group_id })));
      allProfiles = srProfiles.filter(p => p.family_group_id === familyGroupId && memberIds.has(p.family_member_id));
      console.log('filtered sr profiles:', allProfiles.length, allProfiles.map(p => ({ name: p.family_member_name, xp: p.total_xp })));
    } else {
      allProfiles = allProfiles.filter(p => p.family_group_id === familyGroupId && memberIds.has(p.family_member_id));
    }

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
      kelly: profiles.find(p => p.family_member_name === 'Kelly')
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});