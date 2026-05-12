import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const results = { user_email: user.email, user_family_group_id: user.family_group_id };

    // Test 1: filter User by email
    const usersByEmail = await base44.asServiceRole.entities.User.filter({ email: user.email });
    results.userByEmailCount = usersByEmail.length;
    results.freshUser = usersByEmail[0] ? { email: usersByEmail[0].email, family_group_id: usersByEmail[0].family_group_id } : null;

    const familyGroupId = usersByEmail[0]?.family_group_id || user.family_group_id;
    results.resolvedFamilyGroupId = familyGroupId;

    // Test 2: filter FamilyMember by family_group_id
    if (familyGroupId) {
      const membersByFilter = await base44.asServiceRole.entities.FamilyMember.filter({ family_group_id: familyGroupId });
      results.membersByFilterCount = membersByFilter.length;
      results.membersByFilter = membersByFilter.map(m => ({ id: m.id, name: m.name, family_group_id: m.family_group_id }));
    }

    // Test 3: list all FamilyMembers (no filter)
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 200);
    results.allMembersCount = allMembers.length;
    results.allMembersFamilyIds = [...new Set(allMembers.map(m => m.family_group_id))];

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});