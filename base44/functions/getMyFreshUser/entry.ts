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

    if (freshUser.family_group_id) {
      familyGroup = allGroups.find(g => g.id === freshUser.family_group_id) || null;
    }

    // Fallback: if no family_group_id set but user owns a group, use that
    if (!familyGroup) {
      familyGroup = allGroups.find(g => g.owner_email === user.email) || null;
      if (familyGroup) {
        // Patch the freshUser object so the rest of the app works
        freshUser.family_group_id = familyGroup.id;
      }
    }

    return Response.json({ user: freshUser, familyGroup });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});