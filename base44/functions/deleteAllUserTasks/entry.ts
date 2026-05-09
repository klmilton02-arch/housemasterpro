import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyGroupId = user.family_group_id;
    if (!familyGroupId) {
      return Response.json({ error: 'No family group found' }, { status: 400 });
    }

    // Get all tasks in family (paginate if needed)
    let allTasks = [];
    let skip = 0;
    const limit = 100;
    
    while (true) {
      const batch = await base44.asServiceRole.entities.Task.list('', limit, skip);
      const familyTasks = batch.filter(t => t.family_group_id === familyGroupId);
      allTasks.push(...familyTasks);
      
      if (batch.length < limit) break;
      skip += limit;
    }

    let deleted = 0;
    
    // Delete in parallel chunks
    const chunkSize = 20;
    for (let i = 0; i < allTasks.length; i += chunkSize) {
      const chunk = allTasks.slice(i, i + chunkSize);
      const deletePromises = chunk.map(task =>
        base44.asServiceRole.entities.Task.delete(task.id).catch(() => null)
      );
      
      const results = await Promise.all(deletePromises);
      deleted += results.filter(r => r !== null).length;
    }

    return Response.json({ success: true, deleted, message: `Deleted ${deleted} tasks` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});