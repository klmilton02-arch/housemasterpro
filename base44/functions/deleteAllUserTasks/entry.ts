import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query with explicit family_group_id filter
    const filter = user.family_group_id 
      ? { family_group_id: user.family_group_id }
      : { created_by: user.email };

    const tasks = await base44.asServiceRole.entities.Task.filter(filter, null, 2000);
    
    console.log(`Found ${tasks.length} tasks to delete`);

    // Delete in batches
    let deleted = 0;
    const batchSize = 100;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      await Promise.all(batch.map(task => base44.asServiceRole.entities.Task.delete(task.id)));
      deleted += batch.length;
      console.log(`Deleted ${deleted}/${tasks.length}`);
      if (i + batchSize < tasks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return Response.json({ deleted, total: tasks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});