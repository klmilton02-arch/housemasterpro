import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email;

    // Helper function to delete records by filter
    const deleteByFilter = async (entity, filter) => {
      const records = await base44.asServiceRole.entities[entity].filter(filter, '-created_date', 1000);
      for (const record of records) {
        await base44.asServiceRole.entities[entity].delete(record.id);
      }
    };

    // Delete all user-associated data
    await deleteByFilter('Task', { created_by: userEmail });
    await deleteByFilter('GamificationProfile', { family_member_id: userId });
    await deleteByFilter('CompletionHistory', { family_member_id: userId });
    await deleteByFilter('FamilyMember', { created_by: userEmail });
    await deleteByFilter('HorseStable', { family_member_id: userId });
    await deleteByFilter('Subtask', { created_by: userEmail });

    // Delete family groups where user is owner
    const familyGroups = await base44.asServiceRole.entities.FamilyGroup.filter({ owner_email: userEmail }, '-created_date', 100);
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