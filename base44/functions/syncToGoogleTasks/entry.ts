import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69e2b957289ba8a84c5a217a";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Get tasks that are due within the next 30 days and are maintenance tasks
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    const tasks = await base44.entities.Task.list();
    const maintenanceTasks = tasks.filter(t => {
      if (t.status === 'Completed') return false;
      if (!t.next_due_date) return false;
      const due = new Date(t.next_due_date);
      return due <= in30Days;
    });

    // Get or create a "HomeLifeFocus" task list
    const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const listsData = await listsRes.json();
    
    let taskListId;
    const existing = listsData.items?.find(l => l.title === 'HomeLifeFocus');
    if (existing) {
      taskListId = existing.id;
    } else {
      const createRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'HomeLifeFocus' })
      });
      const created = await createRes.json();
      taskListId = created.id;
    }

    // Sync each task
    let synced = 0;
    for (const task of maintenanceTasks) {
      const dueDate = new Date(task.next_due_date);
      dueDate.setUTCHours(0, 0, 0, 0);

      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.name,
          notes: task.description || `Category: ${task.category || ''}${task.room ? ' | Room: ' + task.room : ''}`,
          due: dueDate.toISOString(),
        })
      });
      synced++;
    }

    return Response.json({ success: true, synced, taskListId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});