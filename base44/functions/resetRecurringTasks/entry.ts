import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all completed tasks with frequency
    const completedTasks = await base44.asServiceRole.entities.Task.filter({
      status: "Completed",
      frequency_days: { $exists: true }
    });

    for (const task of completedTasks) {
      const nextDueDate = new Date(task.next_due_date);
      nextDueDate.setHours(0, 0, 0, 0);

      // If next due date is today or earlier, reset the task to Pending
      if (nextDueDate <= today) {
        await base44.asServiceRole.entities.Task.update(task.id, {
          status: "Pending"
        });
      }
    }

    return Response.json({ success: true, tasksReset: completedTasks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});