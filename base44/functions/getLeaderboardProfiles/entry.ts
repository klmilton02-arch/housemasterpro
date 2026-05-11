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
    const [allMembers, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.FamilyMember.filter({ family_group_id: familyGroupId }),
      base44.asServiceRole.entities.GamificationProfile.filter({ family_group_id: familyGroupId }),
    ]);

    // Prefer user-created members over service-role duplicates; dedupe by linked_user_id
    const seen = new Set();
    const members = [];
    // Sort so user-created (non-service) come first
    const sorted = [...allMembers].sort((a, b) => {
      const aService = a.created_by?.includes('service+') ? 1 : 0;
      const bService = b.created_by?.includes('service+') ? 1 : 0;
      return aService - bService;
    });
    for (const m of sorted) {
      const key = m.linked_user_id || m.name;
      if (!seen.has(key)) { seen.add(key); members.push(m); }
    }

    const memberIds = members.map(m => m.id);
    const familyProfiles = allProfiles.filter(p =>
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