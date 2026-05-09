import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return Response.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Only allow if caller is the family group owner or admin
    const targetUser = await base44.asServiceRole.entities.User.get(user_id);
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify caller owns the family group or is admin
    if (caller.role !== 'admin') {
      const familyGroups = await base44.asServiceRole.entities.FamilyGroup.filter({ owner_email: caller.email });
      const ownsFamily = familyGroups.some(fg => fg.id === targetUser.family_group_id);
      if (!ownsFamily) {
        return Response.json({ error: 'Not authorized to remove this user' }, { status: 403 });
      }
    }

    await base44.asServiceRole.entities.User.update(user_id, { family_group_id: null });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});