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

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper: delete records one at a time with retry on rate limit
    const deleteAll = async (entity, filter) => {
      try {
        const records = await base44.asServiceRole.entities[entity].filter(filter, '-created_date', 1000);
        for (const r of records) {
          let attempts = 0;
          while (attempts < 5) {
            try {
              await base44.asServiceRole.entities[entity].delete(r.id);
              await sleep(500);
              break;
            } catch (err) {
              if (err.message && err.message.includes('Rate limit')) {
                attempts++;
                await sleep(1000 * attempts); // back off: 1s, 2s, 3s...
              } else if (err.message && err.message.includes('not found')) {
                break; // already deleted, skip
              } else {
                console.error(`Error deleting ${entity} ${r.id}:`, err.message);
                break;
              }
            }
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