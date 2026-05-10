import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ALL tasks (any status) for this user/family using service role
    let tasks;
    if (user.family_group_id) {
      tasks = await base44.asServiceRole.entities.Task.filter({ family_group_id: user.family_group_id }, null, 1000);
    } else {
      tasks = await base44.asServiceRole.entities.Task.filter({ created_by: user.email }, null, 1000);
    }

    // Delete in batches of 50 to avoid rate limits
    let deleted = 0;
    const batchSize = 50;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      await Promise.all(batch.map(task => base44.asServiceRole.entities.Task.delete(task.id)));
      deleted += batch.length;
      if (i + batchSize < tasks.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return Response.json({ deleted, message: `Deleted ${deleted} pending tasks` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});