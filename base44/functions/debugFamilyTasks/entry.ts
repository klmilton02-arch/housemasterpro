import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all tasks in Milton Family
    const familyGroupId = '6a022b2d26729cca52dd5fb0';
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
    const familyTasks = allTasks.filter(t => t.family_group_id === familyGroupId);

    console.log(`[debugFamilyTasks] Total tasks in Milton Family: ${familyTasks.length}`);
    familyTasks.forEach((t, i) => {
      console.log(`  ${i + 1}. "${t.name}" | category: ${t.category} | created_by: ${t.created_by} | assigned_to: ${t.assigned_to_name || 'unassigned'}`);
    });

    return Response.json({
      familyGroupId,
      totalFamilyTasks: familyTasks.length,
      tasks: familyTasks.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        created_by: t.created_by,
        assigned_to_name: t.assigned_to_name
      }))
    });
  } catch (error) {
    console.error('[debugFamilyTasks] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});