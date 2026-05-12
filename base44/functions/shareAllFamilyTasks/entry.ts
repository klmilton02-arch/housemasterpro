import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const familyGroupId = '6a022b2d26729cca52dd5fb0';
    const targetEmail = 'klmilton02@gmail.com';
    
    // Get all tasks created by or assigned to this user
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
    const userTasks = allTasks.filter(t => 
      t.created_by === targetEmail || t.assigned_to_name === 'Scarlett'
    );

    // Filter to non-Personal tasks
    const tasksToShare = userTasks.filter(t => t.category !== 'Personal');

    console.log(`[shareAllFamilyTasks] Found ${tasksToShare.length} non-Personal tasks to share`);

    // Batch update with family_group_id
    const updated = [];
    let successCount = 0;
    for (const task of tasksToShare) {
      try {
        await base44.asServiceRole.entities.Task.update(task.id, {
          family_group_id: familyGroupId
        });
        successCount++;
        if (updated.length < 5) {
          updated.push({ id: task.id, name: task.name, category: task.category });
        }
      } catch (err) {
        console.error(`[shareAllFamilyTasks] Failed to update ${task.name}: ${err.message}`);
      }
    }

    console.log(`[shareAllFamilyTasks] Updated ${successCount}/${tasksToShare.length} tasks`);

    return Response.json({
      tasksFound: tasksToShare.length,
      tasksUpdated: successCount,
      sampleUpdated: updated
    });
  } catch (error) {
    console.error('[shareAllFamilyTasks] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});