import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ members: [] });

    let familyGroupId = user.family_group_id || null;

    // Refresh family_group_id from DB in case token is stale
    if (!familyGroupId) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const freshUser = allUsers.find(u => u.email === user.email);
      familyGroupId = freshUser?.family_group_id || null;
    }

    // Fall back to checking group ownership
    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      if (ownedGroup) familyGroupId = ownedGroup.id;
    }

    if (!familyGroupId) return Response.json({ members: [] });

    // Try user-scoped first (RLS allows reading own family's members when token has correct family_group_id)
    let members = [];
    try {
      members = await base44.entities.FamilyMember.list('-created_date', 100);
      members = members.filter(m => m.family_group_id === familyGroupId);
    } catch (_) {}

    // Fallback: service role fetch + JS filter
    if (members.length === 0) {
      const all = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
      members = all.filter(m => m.family_group_id === familyGroupId);
    }

    return Response.json({ members });
  } catch (error) {
    console.error('[getFamilyMembers] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});