import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ members: [] });

    // Always check fresh DB user for family_group_id (token can be stale for non-owners)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const freshUser = allUsers.find(u => u.email === user.email) || user;
    const familyGroupId = freshUser.family_group_id || null;

    if (!familyGroupId) {
      // Check if user owns a group
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      if (!ownedGroup) return Response.json({ members: [] });
    }

    // Use user-scoped list — RLS allows reading own family's members
    // But if token is stale, we need to use a fresh token workaround:
    // Fetch all members via service role but from the list (no filter, then filter in JS)
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 200);
    const members = allMembers.filter(m => m.family_group_id === familyGroupId);

    return Response.json({ members });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});