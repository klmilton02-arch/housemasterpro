import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allTasks = await base44.asServiceRole.entities.Task.list("-created_date", 1000);
    await Promise.all(allTasks.map(task => base44.asServiceRole.entities.Task.delete(task.id)));
    
    return Response.json({ success: true, deletedCount: allTasks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});