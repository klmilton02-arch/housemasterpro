import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get app user's Google Tasks connection
    const connectorId = '69e2b957289ba8a84c5a217a'; // HomeLifeFocus
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId);

    // Fetch task lists from Google Tasks
    const listsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const listsData = await listsRes.json();
    const lists = listsData.items || [];

    // Fetch all tasks from each list
    const allTasks = [];
    for (const list of lists) {
      const tasksRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${list.id}/tasks`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const tasksData = await tasksRes.json();
      const tasks = tasksData.items || [];
      allTasks.push(...tasks.map(t => ({ ...t, listName: list.title })));
    }

    // Filter for recurring/home maintenance related tasks
    const maintenanceTasks = allTasks.filter(t => 
      t.title && (
        t.title.toLowerCase().includes('maintenance') ||
        t.title.toLowerCase().includes('home') ||
        t.title.toLowerCase().includes('recurring') ||
        t.title.toLowerCase().includes('clean') ||
        t.recurring // Check if task has recurrence
      ) && !t.completed
    );

    // Sync to app's Task entity
    const syncedTasks = [];
    for (const gtask of maintenanceTasks) {
      try {
        // Check if task already exists
        const existing = await base44.entities.Task.filter({ 
          name: gtask.title 
        });

        if (existing.length === 0) {
          // Create new task
          const newTask = await base44.entities.Task.create({
            name: gtask.title,
            description: gtask.notes || '',
            category: 'Maintenance',
            status: gtask.completed ? 'Completed' : 'Pending',
            frequency_days: 7, // Default weekly for maintenance
            next_due_date: gtask.due || new Date().toISOString().split('T')[0],
            start_date: new Date().toISOString().split('T')[0],
          });
          syncedTasks.push(newTask);
        }
      } catch (e) {
        console.error(`Failed to sync task "${gtask.title}":`, e.message);
      }
    }

    return Response.json({ 
      success: true,
      syncedCount: syncedTasks.length,
      foundCount: maintenanceTasks.length,
      tasks: syncedTasks 
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});