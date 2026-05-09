import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get or create family group for current user
    let familyGroup = null;
    if (user.family_group_id) {
      familyGroup = await base44.entities.FamilyGroup.get(user.family_group_id);
    } else {
      // Create new family group
      const families = await base44.asServiceRole.entities.FamilyGroup.filter(
        { owner_email: user.email }
      );
      
      if (families.length === 0) {
        familyGroup = await base44.asServiceRole.entities.FamilyGroup.create({
          name: "Test Family",
          owner_email: user.email,
          invite_code: "TEST" + Math.random().toString(36).substr(2, 9).toUpperCase()
        });
        
        // Update user with family_group_id
        await base44.auth.updateMe({ family_group_id: familyGroup.id });
      } else {
        familyGroup = families[0];
        await base44.auth.updateMe({ family_group_id: familyGroup.id });
      }
    }

    // Create or get the three family members
    const names = ["Tom", "Scarlett", "Kelly"];
    const colors = ["blue", "purple", "pink"];
    const members = [];

    for (let i = 0; i < names.length; i++) {
      // Check if member already exists
      const existing = await base44.asServiceRole.entities.FamilyMember.filter({
        family_group_id: familyGroup.id,
        name: names[i]
      });

      if (existing.length > 0) {
        members.push(existing[0]);
      } else {
        const member = await base44.asServiceRole.entities.FamilyMember.create({
          family_group_id: familyGroup.id,
          name: names[i],
          avatar_color: colors[i]
        });
        members.push(member);
      }
    }



    return Response.json({ 
      success: true, 
      family_group_id: familyGroup.id,
      members: members.map(m => m.name)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});