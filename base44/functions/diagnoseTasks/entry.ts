import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[diagnoseTasks] user:', user.email, 'family_group_id:', user.family_group_id);

    // Get tasks created by this user
    const myTasks = await base44.entities.Task.filter({ created_by: user.email }, '-created_date', 100);
    console.log('[diagnoseTasks] tasks created by me:', myTasks.length);
    myTasks.slice(0, 5).forEach(t => console.log('  - ', t.name, '(', t.category, ')'));

    // Get family tasks if user has family_group_id
    let familyTasks = [];
    if (user.family_group_id) {
      familyTasks = await base44.entities.Task.filter({ family_group_id: user.family_group_id }, '-created_date', 100);
      console.log('[diagnoseTasks] family tasks:', familyTasks.length);
      familyTasks.slice(0, 5).forEach(t => console.log('  - ', t.name, '(', t.category, ')'));
    }

    // Check Personal tasks
    const personalTasks = await base44.entities.Task.filter({ category: 'Personal', created_by: user.email }, '-created_date', 100);
    console.log('[diagnoseTasks] my personal tasks:', personalTasks.length);
    personalTasks.forEach(t => console.log('  - ', t.name));

    return Response.json({ 
      user: user.email,
      family_group_id: user.family_group_id,
      myTasks: myTasks.length,
      familyTasks: familyTasks.length,
      personalTasks: personalTasks.length,
      sampleMyTasks: myTasks.slice(0, 3).map(t => ({ name: t.name, category: t.category, created_by: t.created_by })),
      sampleFamilyTasks: familyTasks.slice(0, 3).map(t => ({ name: t.name, category: t.category })),
    });
  } catch (error) {
    console.error('[diagnoseTasks] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});