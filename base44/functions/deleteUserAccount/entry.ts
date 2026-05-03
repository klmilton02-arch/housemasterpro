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
    const familyGroupId = user.family_group_id;

    // Helper: delete records one at a time with a small delay to avoid rate limits
    const deleteAll = async (entity, filter) => {
      try {
        const records = await base44.asServiceRole.entities[entity].filter(filter, '-created_date', 1000);
        for (const r of records) {
          try {
            await base44.asServiceRole.entities[entity].delete(r.id);
            await new Promise(resolve => setTimeout(resolve, 150));
          } catch (err) {
            console.error(`Error deleting ${entity} ${r.id}:`, err.message);
          }
        }
      } catch (err) {
        console.log(`Error fetching ${entity}:`, err.message);
      }
    };

    // Delete tasks (the main entity that persists across re-registrations)
    await deleteAll('Task', { created_by: userEmail });

    // Delete remaining user data sequentially to stay within rate limits
    await deleteAll('GamificationProfile', { family_member_id: userId });
    await deleteAll('CompletionHistory', { family_member_id: userId });
    await deleteAll('FamilyMember', { created_by: userEmail });
    await deleteAll('HorseStable', { family_member_id: userId });
    await deleteAll('Subtask', { created_by: userEmail });

    // Delete family groups where user is owner
    if (familyGroupId) {
      await deleteAll('FamilyGroup', { owner_email: userEmail });
    }

    return Response.json({ success: true, message: 'Account data deleted' });
  } catch (error) {
    console.error('Failed to delete account data:', error);
    return Response.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
});