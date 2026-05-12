import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    // Simulate Scarlett's auth context
    const base44 = createClientFromRequest(req);
    
    // Force Scarlett's email in the simulation
    // (in reality, the token would already have her email)
    const scarlettEmail = 'kellymilton02@gmail.com';
    
    // Fetch all users to find Scarlett
    const allUsers = await base44.asServiceRole.entities.User.list();
    const scarlett = allUsers.find(u => u.email === scarlettEmail);
    
    if (!scarlett) {
      return Response.json({ error: 'Scarlett not found', scarlettEmail }, { status: 404 });
    }

    console.log('[testScarlettAccess] Scarlett found:', { 
      email: scarlett.email, 
      family_group_id: scarlett.family_group_id,
      role: scarlett.role
    });

    // Get her family group
    const familyGroup = scarlett.family_group_id 
      ? await base44.asServiceRole.entities.FamilyGroup.list().then(gs => gs.find(g => g.id === scarlett.family_group_id))
      : null;

    console.log('[testScarlettAccess] Family group:', familyGroup);

    // Get tasks visible to Scarlett (simulating her RLS constraints)
    // Tasks she should see:
    // 1. Tasks she created
    // 2. Tasks in her family group (except Personal tasks not created by her/assigned to her)
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
    
    const scarlettVisibleTasks = allTasks.filter(task => {
      // Rule 1: Created by her
      if (task.created_by === scarlettEmail) return true;
      
      // Rule 2: In her family group AND (not Personal OR created by her OR assigned to her)
      if (scarlett.family_group_id && task.family_group_id === scarlett.family_group_id) {
        if (task.category === 'Personal') {
          // Personal tasks: only if created by her or assigned to her
          return task.created_by === scarlettEmail;
        }
        return true; // Non-Personal shared family tasks
      }
      
      return false;
    });

    console.log('[testScarlettAccess] Scarlett visible tasks:', scarlettVisibleTasks.length);
    scarlettVisibleTasks.slice(0, 3).forEach(t => {
      console.log(`  - ${t.name} (category: ${t.category}, created_by: ${t.created_by})`);
    });

    return Response.json({
      scarlett: { email: scarlett.email, family_group_id: scarlett.family_group_id },
      familyGroup: familyGroup ? { id: familyGroup.id, name: familyGroup.name } : null,
      visibleTasksCount: scarlettVisibleTasks.length,
      sampleTasks: scarlettVisibleTasks.slice(0, 5).map(t => ({ 
        id: t.id, 
        name: t.name, 
        category: t.category, 
        created_by: t.created_by 
      }))
    });
  } catch (error) {
    console.error('[testScarlettAccess] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});