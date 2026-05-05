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

    // Helper: batch delete records with optimized rate limiting
    const deleteAll = async (entity, filter) => {
      try {
        const records = await base44.asServiceRole.entities[entity].filter(filter, '-created_date', 1000);
        if (records.length === 0) return;
        
        // Delete in parallel batches of 5 to be efficient but not hit rate limits
        for (let i = 0; i < records.length; i += 5) {
          const batch = records.slice(i, i + 5);
          await Promise.all(
            batch.map(r =>
              base44.asServiceRole.entities[entity].delete(r.id)
                .catch(err => {
                  if (!err.message?.includes('not found')) {
                    console.error(`Error deleting ${entity} ${r.id}:`, err.message);
                  }
                })
            )
          );
          // Small delay between batches to avoid rate limits
          if (i + 5 < records.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (err) {
        console.log(`Error fetching ${entity}:`, err.message);
      }
    };

    // Delete all user data in parallel for speed
    await Promise.all([
      deleteAll('Task', { created_by: userEmail }),
      deleteAll('GamificationProfile', { family_member_id: userId }),
      deleteAll('CompletionHistory', { family_member_id: userId }),
      deleteAll('FamilyMember', { created_by: userEmail }),
      deleteAll('HorseStable', { family_member_id: userId }),
      deleteAll('Subtask', { created_by: userEmail }),
      familyGroupId ? deleteAll('FamilyGroup', { owner_email: userEmail }) : Promise.resolve(),
    ]);

    return Response.json({ success: true, message: 'Account data deleted' });
  } catch (error) {
    console.error('Failed to delete account data:', error);
    return Response.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
});