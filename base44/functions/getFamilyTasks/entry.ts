import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      console.log('[getFamilyTasks] no user');
      return Response.json({ tasks: [] });
    }

    const body = await req.json().catch(() => ({}));
    
    // Use passed family_group_id if provided, otherwise resolve from user
    let familyGroupId = body.family_group_id || user.family_group_id || null;
    console.log('[getFamilyTasks] user.email:', user.email, 'body.family_group_id:', body.family_group_id, 'user.family_group_id:', user.family_group_id);

    // If still no family_group_id, try to resolve it
    if (!familyGroupId) {
      // Check if user owns a group
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      if (ownedGroup) {
        familyGroupId = ownedGroup.id;
        console.log('[getFamilyTasks] resolved via owned group:', familyGroupId);
      } else {
        // Check if user is linked as a family member
        const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
        const match = allMembers.find(m => m.linked_user_email?.toLowerCase() === user.email?.toLowerCase());
        if (match?.family_group_id) {
          familyGroupId = match.family_group_id;
          console.log('[getFamilyTasks] resolved via member link:', familyGroupId);
        }
      }
    }

    console.log('[getFamilyTasks] final familyGroupId:', familyGroupId);

    let tasks = [];
    
    if (familyGroupId) {
      // Family user: get all tasks, then filter to show:
      // 1. Tasks created by them
      // 2. Non-Personal family tasks with matching family_group_id
      const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
      console.log('[getFamilyTasks] total tasks in db:', allTasks.length);
      const personalTasks = allTasks.filter(t => t.category === 'Personal' && t.created_by === user.email);
      console.log('[getFamilyTasks] personal tasks created by', user.email, ':', personalTasks.length, personalTasks.map(t => t.name));
      tasks = allTasks.filter(t => {
        // Rule 1: Task created by this user (standard tasks)
        if (t.created_by === user.email) {
          return true;
        }

        // Rule 1b: Personal tasks with personal_owner_email set to this user
        // (created via service role by createPersonalTask function)
        if (t.category === 'Personal' && t.personal_owner_email === user.email) {
          return true;
        }
        
        // Rule 2: Non-Personal tasks visible to family members (must have matching family_group_id)
        if (t.category !== 'Personal' && t.family_group_id === familyGroupId) {
          return true;
        }
        
        return false;
      });
      console.log('[getFamilyTasks]', user.email, 'family user - loaded', tasks.length, 'family tasks');
    } else {
      // Solo user: use RLS to get their own tasks
      tasks = await base44.entities.Task.list('-created_date', 5000);
      console.log('[getFamilyTasks]', user.email, 'solo user - loaded', tasks.length, 'personal tasks');
    }

    return Response.json({ tasks });
  } catch (error) {
    console.error('[getFamilyTasks] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});