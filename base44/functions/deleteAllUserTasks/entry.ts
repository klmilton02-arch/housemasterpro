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

    // Get all tasks user can access
    const allTasks = await base44.entities.Task.list();
    
    // Filter to only tasks in this family
    const tasksToDelete = allTasks.filter(t => t.family_group_id === familyGroupId);

    let deleted = 0;

    // Delete in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < tasksToDelete.length; i += batchSize) {
      const batch = tasksToDelete.slice(i, i + batchSize);
      
      // Delete calendar events first
      for (const task of batch) {
        if (task.calendar_event_id) {
          try {
            await base44.functions.invoke('deleteCalendarEvent', { taskId: task.id });
          } catch (e) {
            console.error(`Failed to delete calendar event for task ${task.id}:`, e);
          }
        }
      }

      // Delete tasks in this batch
      for (const task of batch) {
        try {
          await base44.asServiceRole.entities.Task.delete(task.id);
          deleted++;
        } catch (e) {
          console.error(`Failed to delete task ${task.id}:`, e);
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return Response.json({ success: true, deleted, message: `Deleted ${deleted} tasks` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});