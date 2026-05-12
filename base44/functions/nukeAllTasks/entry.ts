import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all tasks
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
    
    console.log(`[nukeAllTasks] Found ${allTasks.length} tasks to delete`);

    // Delete all tasks
    let deleted = 0;
    for (const task of allTasks) {
      try {
        await base44.asServiceRole.entities.Task.delete(task.id);
        deleted++;
      } catch (err) {
        console.error(`[nukeAllTasks] Failed to delete ${task.name}: ${err.message}`);
      }
    }

    console.log(`[nukeAllTasks] Deleted ${deleted}/${allTasks.length} tasks`);

    return Response.json({
      tasksFound: allTasks.length,
      tasksDeleted: deleted
    });
  } catch (error) {
    console.error('[nukeAllTasks] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});