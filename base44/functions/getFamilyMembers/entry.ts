import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ members: [] });

    // Always use fresh DB user to get the real family_group_id (token can be stale)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const freshUser = allUsers.find(u => u.email === user.email) || user;

    let familyGroupId = freshUser.family_group_id || null;

    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      familyGroupId = ownedGroup?.id || null;
    }

    if (!familyGroupId) return Response.json({ members: [] });

    // Use service role with explicit filter so stale auth tokens don't break RLS
    const members = await base44.asServiceRole.entities.FamilyMember.filter({ family_group_id: familyGroupId });

    return Response.json({ members });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});