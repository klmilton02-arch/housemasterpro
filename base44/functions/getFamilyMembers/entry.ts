import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ members: [] });

    // Always resolve family_group_id from DB — never trust the auth token (can be stale)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const freshUser = allUsers.find(u => u.email === user.email) || user;
    let familyGroupId = freshUser.family_group_id || null;

    // Fallback: check if user owns a family group
    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      if (ownedGroup) familyGroupId = ownedGroup.id;
    }

    // Fallback: check FamilyMember records linked to this user's email
    if (!familyGroupId) {
      const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
      const match = allMembers.find(m => m.linked_user_email?.toLowerCase() === user.email?.toLowerCase());
      if (match?.family_group_id) familyGroupId = match.family_group_id;
    }

    if (!familyGroupId) return Response.json({ members: [] });

    // Fetch all members and filter by family group (service role bypasses RLS)
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
    const members = allMembers.filter(m => m.family_group_id === familyGroupId);

    return Response.json({ members });
  } catch (error) {
    console.error('[getFamilyMembers] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});