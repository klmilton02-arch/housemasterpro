import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.family_group_id) {
      return Response.json({ error: 'User must belong to a family group' }, { status: 400 });
    }

    // Get the configured day_start_hour from HomeSetup for this family group
    const setups = await base44.asServiceRole.entities.HomeSetup.filter({
      family_group_id: user.family_group_id
    });
    const dayStartHour = setups.length > 0 && setups[0].day_start_hour != null
      ? setups[0].day_start_hour
      : 0;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(dayStartHour, 0, 0, 0);
    if (now < todayStart) {
      todayStart.setDate(todayStart.getDate() - 1);
    }

    const allTasks = await base44.asServiceRole.entities.Task.filter({
      family_group_id: user.family_group_id,
      status: "Completed"
    });
    const completedTasks = allTasks;

    if (completedTasks.length === 0) {
      return Response.json({ message: "No completed tasks to reset", resetCount: 0 });
    }

    const tasksToReset = completedTasks.filter(task => {
      const dueDate = new Date(task.next_due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= todayStart;
    });

    await Promise.all(
      tasksToReset.map(task =>
        base44.asServiceRole.entities.Task.update(task.id, { status: "Pending" })
      )
    );

    return Response.json({
      message: `Reset ${tasksToReset.length} tasks to pending`,
      resetCount: tasksToReset.length,
      dayStartHour
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});