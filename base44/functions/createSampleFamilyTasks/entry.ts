import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const familyGroupId = '6a022b2d26729cca52dd5fb0';

    // Create sample cleaning and maintenance tasks
    const tasks = [
      {
        name: "Vacuum Living Room",
        category: "Cleaning",
        room: "Living Room",
        priority: "Medium",
        difficulty: "Easy",
        frequency_days: 7,
        start_date: "2026-05-12",
        next_due_date: "2026-05-19",
        status: "Pending",
        family_group_id: familyGroupId,
        overdue_grace_days: 3
      },
      {
        name: "Clean Bathrooms",
        category: "Cleaning",
        room: "Bathroom",
        priority: "High",
        difficulty: "Medium",
        frequency_days: 3,
        start_date: "2026-05-12",
        next_due_date: "2026-05-15",
        status: "Pending",
        family_group_id: familyGroupId,
        overdue_grace_days: 3
      },
      {
        name: "HVAC Filter Replacement",
        category: "Maintenance",
        priority: "High",
        difficulty: "Easy",
        frequency_days: 90,
        start_date: "2026-05-12",
        next_due_date: "2026-08-10",
        status: "Pending",
        family_group_id: familyGroupId,
        overdue_grace_days: 3
      },
      {
        name: "Check Smoke Detectors",
        category: "Maintenance",
        priority: "Medium",
        difficulty: "Trivial",
        frequency_days: 30,
        start_date: "2026-05-12",
        next_due_date: "2026-06-11",
        status: "Pending",
        family_group_id: familyGroupId,
        overdue_grace_days: 3
      }
    ];

    const created = [];
    for (const task of tasks) {
      const result = await base44.asServiceRole.entities.Task.create(task);
      created.push({ id: result.id, name: result.name });
      console.log(`[createSampleFamilyTasks] Created: ${result.name}`);
    }

    return Response.json({
      created: created.length,
      tasks: created
    });
  } catch (error) {
    console.error('[createSampleFamilyTasks] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});