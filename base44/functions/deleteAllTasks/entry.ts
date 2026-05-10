import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Use service role to get ALL tasks in the system
    const tasks = await base44.asServiceRole.entities.Task.list(null, 5000);
    
    console.log(`Found ${tasks.length} total tasks`);

    if (tasks.length === 0) {
      return Response.json({ deleted: 0, message: 'No tasks found to delete' });
    }

    // Delete all in batches
    let deleted = 0;
    const batchSize = 100;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      await Promise.all(batch.map(t => base44.asServiceRole.entities.Task.delete(t.id)));
      deleted += batch.length;
      console.log(`Deleted ${deleted}/${tasks.length}`);
      if (i + batchSize < tasks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return Response.json({ deleted, total: tasks.length, message: `Deleted all ${deleted} tasks` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});