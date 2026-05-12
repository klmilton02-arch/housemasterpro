import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Find Kelly's member record
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list();
    const kellyMember = allMembers.find(m => m.linked_user_email === 'klmilton02@gmail.com');
    
    if (!kellyMember) {
      return Response.json({ error: 'Kelly member not found' });
    }

    const familyGroupId = kellyMember.family_group_id;
    
    // Update Kelly's User record with family_group_id and account_type
    const allUsers = await base44.asServiceRole.entities.User.list();
    const kellyUser = allUsers.find(u => u.email === 'klmilton02@gmail.com');
    
    if (kellyUser && (!kellyUser.family_group_id || kellyUser.account_type !== 'family')) {
      await base44.asServiceRole.entities.User.update(kellyUser.id, {
        family_group_id: familyGroupId,
        account_type: 'family',
      });
      return Response.json({
        success: true,
        message: 'Updated Kelly user with family_group_id',
        user_id: kellyUser.id,
        family_group_id: familyGroupId,
      });
    }

    return Response.json({
      success: true,
      message: 'Kelly already has family access',
      user_id: kellyUser?.id,
      family_group_id: familyGroupId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});