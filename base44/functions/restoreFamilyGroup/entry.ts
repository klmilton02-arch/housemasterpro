import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has a family_group_id but no FamilyGroup record
    if (!user.family_group_id) {
      return Response.json({ error: 'User has no family group assigned' }, { status: 400 });
    }

    // Try to fetch the family group
    let familyGroup;
    try {
      familyGroup = await base44.asServiceRole.entities.FamilyGroup.get(user.family_group_id);
      return Response.json({ success: true, message: 'Family group already exists', family_group: familyGroup });
    } catch (err) {
      // Family group doesn't exist, we need to create it
    }

    // Get family members to find the owner
    const familyMembers = await base44.asServiceRole.entities.FamilyMember.filter({ family_group_id: user.family_group_id });
    
    if (familyMembers.length === 0) {
      return Response.json({ error: 'No family members found for this group' }, { status: 400 });
    }

    // Find owner (usually the one created by klmilton02@gmail.com or the admin)
    const owner = familyMembers.find(m => m.created_by === 'klmilton02@gmail.com') || familyMembers[0];

    // Create the missing FamilyGroup using service role
    const newFamilyGroup = await base44.asServiceRole.entities.FamilyGroup.create({
      id: user.family_group_id,
      name: "Family",
      invite_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      owner_email: owner.created_by || 'klmilton02@gmail.com',
    });

    return Response.json({
      success: true,
      message: 'Family group restored',
      family_group: newFamilyGroup,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});