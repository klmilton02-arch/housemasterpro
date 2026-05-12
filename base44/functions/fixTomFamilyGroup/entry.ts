import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const CORRECT_FAMILY_GROUP_ID = '6a022b2d26729cca52dd5fb0';
    const TOM_USER_ID = '69ff6e1e8f693f5c7c4845a8';

    await base44.asServiceRole.entities.User.update(TOM_USER_ID, {
      family_group_id: CORRECT_FAMILY_GROUP_ID,
      account_type: 'family',
    });

    return Response.json({ success: true, message: "Tom's family_group_id fixed to " + CORRECT_FAMILY_GROUP_ID });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});