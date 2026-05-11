import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ members: [] });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const freshUser = allUsers.find(u => u.email === user.email) || user;

    let familyGroupId = freshUser.family_group_id || null;

    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      familyGroupId = ownedGroup?.id || null;
    }

    if (!familyGroupId) return Response.json({ members: [], debug: 'no familyGroupId' });

    const allMembers = await base44.asServiceRole.entities.FamilyMember.list();
    // Return first member's structure to debug
    return Response.json({ 
      familyGroupId, 
      totalMembers: allMembers.length,
      sampleMember: allMembers[0],
      sampleKeys: allMembers[0] ? Object.keys(allMembers[0]) : []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});