import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Find family group owned by this admin
    const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
    const ownedGroup = allGroups.find(g => g.owner_email === user.email);

    if (!ownedGroup) {
      return Response.json({ error: 'No family group owned by this admin' }, { status: 400 });
    }

    // Update admin's family_group_id
    await base44.asServiceRole.entities.User.update(user.id, {
      family_group_id: ownedGroup.id
    });

    return Response.json({ success: true, family_group_id: ownedGroup.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});