import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all completed tasks
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 1000);
    const completedTasks = allTasks.filter(t => t.status === "Completed");
    
    if (completedTasks.length === 0) {
      return Response.json({ message: "No completed tasks to reset", resetCount: 0 });
    }
    
    // Reset tasks whose next_due_date is today or in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tasksToReset = completedTasks.filter(task => {
      const dueDate = new Date(task.next_due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= today;
    });
    
    await Promise.all(
      tasksToReset.map(task =>
        base44.asServiceRole.entities.Task.update(task.id, {
          status: "Pending"
        })
      )
    );
    
    return Response.json({ 
      message: `Reset ${tasksToReset.length} tasks to pending`, 
      resetCount: tasksToReset.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});