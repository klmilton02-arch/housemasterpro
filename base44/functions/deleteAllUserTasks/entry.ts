import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tasks
    const allTasks = await base44.entities.Task.list();

    let deleted = 0;
    
    // Delete sequentially with delays to avoid rate limit
    for (const task of allTasks) {
      try {
        await base44.entities.Task.delete(task.id);
        deleted++;
      } catch (e) {
        // Skip failures
      }
      // Small delay between deletes
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return Response.json({ success: true, deleted, message: `Deleted ${deleted} tasks` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});