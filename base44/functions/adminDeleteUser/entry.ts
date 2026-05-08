import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Get the user to delete
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];

    // Delete all tasks created by this user
    if (targetUser.family_group_id) {
      const tasks = await base44.asServiceRole.entities.Task.filter({ created_by: email });
      for (const task of tasks) {
        await base44.asServiceRole.entities.Task.delete(task.id);
      }

      // Delete family members created by this user
      const familyMembers = await base44.asServiceRole.entities.FamilyMember.filter({ created_by: email });
      for (const member of familyMembers) {
        await base44.asServiceRole.entities.FamilyMember.delete(member.id);
      }

      // Unlink family members that reference this user
      const allMembers = await base44.asServiceRole.entities.FamilyMember.filter({ linked_user_email: email });
      for (const member of allMembers) {
        await base44.asServiceRole.entities.FamilyMember.update(member.id, {
          linked_user_id: null,
          linked_user_email: null,
        });
      }

      // Delete gamification profile if exists
      const gamProfiles = await base44.asServiceRole.entities.GamificationProfile.filter({ created_by: email });
      for (const profile of gamProfiles) {
        await base44.asServiceRole.entities.GamificationProfile.delete(profile.id);
      }
    }

    // Delete the user
    await base44.asServiceRole.entities.User.delete(targetUser.id);

    return Response.json({
      success: true,
      message: `User ${email} and all associated data deleted successfully`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});