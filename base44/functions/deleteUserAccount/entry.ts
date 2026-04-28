import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all user-associated data
    const userId = user.id;
    const userEmail = user.email;

    // Delete tasks
    await base44.asServiceRole.entities.Task.deleteMany({ created_by: userEmail });

    // Delete gamification profile
    await base44.asServiceRole.entities.GamificationProfile.deleteMany({ family_member_id: userId });

    // Delete completion history
    await base44.asServiceRole.entities.CompletionHistory.deleteMany({ family_member_id: userId });

    // Delete family members (if any)
    await base44.asServiceRole.entities.FamilyMember.deleteMany({ created_by: userEmail });

    // Delete horse stable data
    await base44.asServiceRole.entities.HorseStable.deleteMany({ family_member_id: userId });

    // Delete family group if user is owner
    const familyGroups = await base44.asServiceRole.entities.FamilyGroup.filter({ owner_email: userEmail });
    for (const group of familyGroups) {
      await base44.asServiceRole.entities.FamilyGroup.delete(group.id);
    }

    // Delete the user record
    await base44.asServiceRole.entities.User.delete(userId);

    return Response.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return Response.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
});