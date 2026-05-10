import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch without any filter — just get all tasks
    let allTasks = [];
    try {
      allTasks = await base44.asServiceRole.entities.Task.list(null, 5000);
    } catch (e) {
      console.log('List error:', e.message);
    }

    console.log(`Found ${allTasks.length} tasks via list()`);

    if (allTasks.length === 0) {
      // If list is empty, try filter with empty object
      try {
        allTasks = await base44.asServiceRole.entities.Task.filter({}, null, 5000);
        console.log(`Found ${allTasks.length} tasks via filter({})`);
      } catch (e) {
        console.log('Filter error:', e.message);
      }
    }

    if (allTasks.length === 0) {
      return Response.json({ 
        deleted: 0, 
        message: 'No tasks found',
        debug: { listedTasks: 0 }
      });
    }

    // Delete in batches
    let deleted = 0;
    const batchSize = 50;
    
    for (let i = 0; i < allTasks.length; i += batchSize) {
      const batch = allTasks.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(t => base44.asServiceRole.entities.Task.delete(t.id))
      );
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      deleted += succeeded;
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: deleted ${succeeded}/${batch.length}`);
      
      if (i + batchSize < allTasks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return Response.json({ 
      deleted, 
      total: allTasks.length,
      message: `Successfully deleted ${deleted}/${allTasks.length} tasks`
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});