import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all tasks and filter for orphaned ones
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 500);
    let deletedCount = 0;

    for (const task of allTasks) {
      // Check if the creator still exists
      const creator = await base44.asServiceRole.entities.User.filter({ email: task.created_by }, '-created_date', 1);
      if (creator.length === 0) {
        // User no longer exists, delete the task
        await base44.asServiceRole.entities.Task.delete(task.id);
        deletedCount++;
      }
    }

    return Response.json({ success: true, deletedCount, message: `Deleted ${deletedCount} orphaned tasks` });
  } catch (error) {
    console.error('Failed to cleanup orphaned tasks:', error);
    return Response.json({ error: error.message || 'Failed to cleanup' }, { status: 500 });
  }
});