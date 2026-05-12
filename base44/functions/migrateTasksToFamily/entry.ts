import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const familyGroupId = '6a022b2d26729cca52dd5fb0';
    
    // Get all non-Personal tasks without family_group_id
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
    const tasksToUpdate = allTasks.filter(t => 
      t.category !== 'Personal' && !t.family_group_id
    );

    console.log(`[migrateTasksToFamily] Found ${tasksToUpdate.length} non-Personal tasks to migrate`);

    // Batch update using asServiceRole - bypass RLS
    const updated = [];
    for (const task of tasksToUpdate) {
      try {
        // Create a fresh update call - asServiceRole should work for bulk operations
        const result = await base44.asServiceRole.entities.Task.update(task.id, {
          family_group_id: familyGroupId
        });
        updated.push({ id: task.id, name: task.name, status: 'success' });
        console.log(`[migrateTasksToFamily] ✓ ${task.name}`);
      } catch (err) {
        console.error(`[migrateTasksToFamily] ✗ ${task.name}: ${err.message}`);
        updated.push({ id: task.id, name: task.name, status: 'failed', error: err.message });
      }
    }

    return Response.json({
      tasksToMigrate: tasksToUpdate.length,
      tasksUpdated: updated.filter(u => u.status === 'success').length,
      results: updated
    });
  } catch (error) {
    console.error('[migrateTasksToFamily] fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});