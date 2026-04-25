import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get the configured day_start_hour from HomeSetup
    const setups = await base44.asServiceRole.entities.HomeSetup.list();
    const dayStartHour = setups.length > 0 && setups[0].day_start_hour != null
      ? setups[0].day_start_hour
      : 0;

    const now = new Date();
    // "Today" starts at the configured hour
    const todayStart = new Date(now);
    todayStart.setHours(dayStartHour, 0, 0, 0);
    // If we haven't reached today's start hour yet, treat yesterday as the current day
    if (now < todayStart) {
      todayStart.setDate(todayStart.getDate() - 1);
    }

    const completedTasks = await base44.asServiceRole.entities.Task.filter({
      status: "Completed",
      frequency_days: { $exists: true }
    });

    let tasksReset = 0;
    for (const task of completedTasks) {
      const nextDueDate = new Date(task.next_due_date);
      nextDueDate.setHours(0, 0, 0, 0);
      if (nextDueDate <= todayStart) {
        await base44.asServiceRole.entities.Task.update(task.id, { status: "Pending" });
        tasksReset++;
      }
    }

    return Response.json({ success: true, tasksReset, dayStartHour });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});