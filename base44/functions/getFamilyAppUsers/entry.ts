import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ users: [] });

    // Get fresh user data
    const allUsers = await base44.asServiceRole.entities.User.list();
    const freshUser = allUsers.find(u => u.email === user.email) || user;

    // Determine family_group_id: from user record or owned family group
    let familyGroupId = freshUser.family_group_id;
    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      familyGroupId = ownedGroup?.id || null;
    }

    if (!familyGroupId) return Response.json({ users: [] });

    const familyUsers = allUsers.filter(u => u.family_group_id === familyGroupId || u.email === user.email);

    return Response.json({ users: familyUsers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});