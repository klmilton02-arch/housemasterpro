import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const familyGroupId = '6a022b2d26729cca52dd5fb0';
    
    // Fix Scarlett (kellymilton02@gmail.com)
    const scarlett = await base44.asServiceRole.entities.User.filter({ email: 'kellymilton02@gmail.com' });
    if (scarlett.length > 0) {
      await base44.asServiceRole.entities.User.update(scarlett[0].id, {
        family_group_id: familyGroupId,
        account_type: 'family'
      });
      console.log('✓ Fixed Scarlett');
    }

    // Fix Tom (thomasdugger1@gmail.com)
    const tom = await base44.asServiceRole.entities.User.filter({ email: 'thomasdugger1@gmail.com' });
    if (tom.length > 0) {
      await base44.asServiceRole.entities.User.update(tom[0].id, {
        family_group_id: familyGroupId,
        account_type: 'family'
      });
      console.log('✓ Fixed Tom');
    } else {
      console.log('⚠ Tom not found in User table');
    }

    // Kelly (klmilton02@gmail.com) already set
    console.log('✓ Kelly already fixed');

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});