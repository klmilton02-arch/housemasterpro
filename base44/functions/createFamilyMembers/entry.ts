import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const familyGroupId = '6a022b2d26729cca52dd5fb0';
    
    // Create Kelly (admin - klmilton02@gmail.com)
    const kelly = await base44.asServiceRole.entities.FamilyMember.create({
      family_group_id: familyGroupId,
      name: 'Kelly',
      avatar_color: 'blue',
      linked_user_id: '69dbef90b0bb680f2754a0d4',
      linked_user_email: 'klmilton02@gmail.com'
    });

    // Create Scarlett (kellymilton02@gmail.com)
    const scarlett = await base44.asServiceRole.entities.FamilyMember.create({
      family_group_id: familyGroupId,
      name: 'Scarlett',
      avatar_color: 'pink',
      linked_user_id: '69fe65abb930a88310729a4a',
      linked_user_email: 'kellymilton02@gmail.com'
    });

    // Create Tom (thomasdugger1@gmail.com)
    const tom = await base44.asServiceRole.entities.FamilyMember.create({
      family_group_id: familyGroupId,
      name: 'Tom',
      avatar_color: 'green',
      linked_user_id: '69ff6e1e8f693f5c7c4845a8',
      linked_user_email: 'thomasdugger1@gmail.com'
    });

    return Response.json({
      success: true,
      created: [
        { name: 'Kelly', id: kelly.id },
        { name: 'Scarlett', id: scarlett.id },
        { name: 'Tom', id: tom.id }
      ]
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});