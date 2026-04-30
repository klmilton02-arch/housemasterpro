import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userEmail, targetUserEmail } = await req.json();

    // Get all users and find by email
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.email === targetUserEmail);
    if (!targetUser) {
      return Response.json({ error: 'Target user not found' }, { status: 404 });
    }

    const familyGroupId = targetUser.family_group_id;
    if (!familyGroupId) {
      return Response.json({ error: 'Target user has no family group' }, { status: 400 });
    }

    // Find the user to reassign
    const userToUpdate = allUsers.find(u => u.email === userEmail);
    if (!userToUpdate) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user's family_group_id
    await base44.asServiceRole.entities.User.update(userToUpdate.id, {
      family_group_id: familyGroupId
    });

    return Response.json({ success: true, message: `${userEmail} moved to ${targetUserEmail}'s family` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});