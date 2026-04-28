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

    // Helper function to batch delete records by filter
    const deleteByFilter = async (entity, filter) => {
      try {
        const records = await base44.asServiceRole.entities[entity].filter(filter, '-created_date', 1000);
        // Batch delete in groups of 10 with small delays to avoid rate limits
        for (let i = 0; i < records.length; i += 10) {
          const batch = records.slice(i, i + 10);
          await Promise.all(batch.map(r => base44.asServiceRole.entities[entity].delete(r.id)));
          if (i + 10 < records.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (err) {
        console.log(`Error deleting ${entity}:`, err.message);
      }
    };

    // Delete all user-associated data in parallel
    await Promise.all([
      deleteByFilter('Task', { created_by: userEmail }),
      deleteByFilter('GamificationProfile', { family_member_id: userId }),
      deleteByFilter('CompletionHistory', { family_member_id: userId }),
      deleteByFilter('FamilyMember', { created_by: userEmail }),
      deleteByFilter('HorseStable', { family_member_id: userId }),
      deleteByFilter('Subtask', { created_by: userEmail }),
    ]);

    // Delete family groups where user is owner
    if (familyGroupId) {
      const familyGroups = await base44.asServiceRole.entities.FamilyGroup.filter({ owner_email: userEmail }, '-created_date', 100);
      for (let i = 0; i < familyGroups.length; i += 10) {
        const batch = familyGroups.slice(i, i + 10);
        await Promise.all(batch.map(g => base44.asServiceRole.entities.FamilyGroup.delete(g.id)));
        if (i + 10 < familyGroups.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    return Response.json({ success: true, message: 'Account deletion initiated' });
  } catch (error) {
    console.error('Failed to delete account data:', error);
    return Response.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
});