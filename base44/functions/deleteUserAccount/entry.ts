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

    // Helper: delete records one at a time with proper rate limit handling
    const deleteAll = async (entity, filter) => {
      try {
        const records = await base44.asServiceRole.entities[entity].filter(filter, '-created_date', 1000);
        if (records.length === 0) return;
        
        for (const record of records) {
          try {
            await base44.asServiceRole.entities[entity].delete(record.id);
          } catch (err) {
            // Ignore 'not found' errors, they're already deleted
            if (!err.message?.includes('not found')) {
              console.error(`Error deleting ${entity} ${record.id}:`, err.message);
            }
          }
          // 50ms delay between deletions to stay below rate limits
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (err) {
        console.log(`Error fetching ${entity}:`, err.message);
      }
    };

    // Delete sequentially to avoid rate limiting, but process multiple entities in parallel
    await Promise.all([
      deleteAll('Task', { created_by: userEmail }),
      deleteAll('GamificationProfile', { family_member_id: userId }),
      deleteAll('CompletionHistory', { family_member_id: userId }),
      deleteAll('FamilyMember', { created_by: userEmail }),
      deleteAll('HorseStable', { family_member_id: userId }),
      deleteAll('Subtask', { created_by: userEmail }),
      familyGroupId ? deleteAll('FamilyGroup', { owner_email: userEmail }) : Promise.resolve(),
    ]);

    return Response.json({ success: true, message: 'Account data deleted', logout: true });
  } catch (error) {
    console.error('Failed to delete account data:', error);
    return Response.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
});