import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch fresh user data from DB (bypasses stale token cache)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const freshUser = allUsers.find(u => u.email === user.email) || user;

    // Find family group: first by family_group_id, then fallback to owned group
    let familyGroup = null;
    const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();

    if (freshUser.family_group_id && freshUser.family_group_id.trim()) {
      familyGroup = allGroups.find(g => g.id === freshUser.family_group_id) || null;
    }

    // Fallback: if no family_group_id set but user owns a group, use that
    if (!familyGroup) {
      familyGroup = allGroups.find(g => g.owner_email === user.email) || null;
      if (familyGroup) {
        freshUser.family_group_id = familyGroup.id;
      }
    }

    // Fallback: if still no family group, check if any FamilyMember has this user's email as linked_user_email
    if (!familyGroup) {
      const allMembers = await base44.asServiceRole.entities.FamilyMember.list();
      const matchingMember = allMembers.find(
        m => m.linked_user_email?.toLowerCase().trim() === freshUser.email?.toLowerCase().trim()
      );
      if (matchingMember?.family_group_id) {
        familyGroup = allGroups.find(g => g.id === matchingMember.family_group_id) || null;
        if (familyGroup) {
          freshUser.family_group_id = familyGroup.id;
          freshUser.account_type = 'family';
          // Persist this so future logins are instant
          await base44.asServiceRole.entities.User.update(freshUser.id, {
            family_group_id: familyGroup.id,
            account_type: 'family',
          });
          // Also store their user ID on the member record if not already set
          if (!matchingMember.linked_user_id) {
            await base44.asServiceRole.entities.FamilyMember.update(matchingMember.id, {
              linked_user_id: freshUser.id,
            });
          }
        }
      }
    }

    return Response.json({ user: freshUser, familyGroup });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});