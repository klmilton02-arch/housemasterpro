import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let deleted = 0;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const tasks = await base44.asServiceRole.entities.Task.list(null, 50);
      if (tasks.length === 0) break;

      for (const task of tasks) {
        try {
          await base44.asServiceRole.entities.Task.delete(task.id);
          deleted++;
        } catch (e) {
          console.error(`Failed to delete task ${task.id}:`, e.message);
        }
      }

      attempts++;
      // Small delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return Response.json({ success: true, tasksDeleted: deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});