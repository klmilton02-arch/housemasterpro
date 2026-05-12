import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all tasks multiple times to catch any we miss
    let allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
    let deleted = 0;

    while (allTasks.length > 0) {
      console.log(`[forceNukeAllTasks] Round: found ${allTasks.length} tasks`);
      
      for (const task of allTasks) {
        try {
          await base44.asServiceRole.entities.Task.delete(task.id);
          deleted++;
          console.log(`[forceNukeAllTasks] ✓ Deleted: ${task.name}`);
        } catch (err) {
          console.error(`[forceNukeAllTasks] ✗ Failed to delete ${task.id}: ${err.message}`);
        }
      }

      // Check if any tasks remain
      allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
    }

    console.log(`[forceNukeAllTasks] Total deleted: ${deleted}`);

    return Response.json({
      totalDeleted: deleted,
      remaining: 0
    });
  } catch (error) {
    console.error('[forceNukeAllTasks] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});