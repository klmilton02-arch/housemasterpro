import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tasks with .list()
    const allTasks = await base44.entities.Task.list();
    
    // Sample first 5 to see structure
    const samples = allTasks.slice(0, 5).map(t => ({
      id: t.id,
      name: t.name,
      family_group_id: t.family_group_id,
      created_by: t.created_by
    }));

    return Response.json({ 
      totalViaList: allTasks.length,
      samples
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});