import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Find Kelly's family group via member lookup
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list();
    const kellyMember = allMembers.find(m => m.linked_user_email === 'klmilton02@gmail.com');
    
    if (!kellyMember) {
      return Response.json({ error: 'Kelly member not found' });
    }

    const familyGroupId = kellyMember.family_group_id;
    
    // Find all tasks created by Kelly
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
    const kellyTasks = allTasks.filter(t => t.created_by === 'klmilton02@gmail.com');

    // Update each task to have family_group_id
    let updated = 0;
    for (const task of kellyTasks) {
      if (!task.family_group_id || task.family_group_id !== familyGroupId) {
        await base44.asServiceRole.entities.Task.update(task.id, {
          family_group_id: familyGroupId,
        });
        updated++;
      }
    }

    return Response.json({
      success: true,
      message: `Updated ${updated} of ${kellyTasks.length} Kelly tasks with family_group_id`,
      family_group_id: familyGroupId,
      total_tasks: kellyTasks.length,
      updated: updated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});