import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all pending tasks for this user/family
    let tasks;
    if (user.family_group_id) {
      tasks = await base44.entities.Task.filter({ family_group_id: user.family_group_id, status: 'Pending' }, null, 1000);
    } else {
      tasks = await base44.entities.Task.filter({ created_by: user.email, status: 'Pending' }, null, 1000);
    }

    // Delete all pending tasks
    const deletePromises = tasks.map(task => base44.entities.Task.delete(task.id));
    await Promise.all(deletePromises);

    return Response.json({ deleted: tasks.length, message: `Deleted ${tasks.length} pending tasks` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});