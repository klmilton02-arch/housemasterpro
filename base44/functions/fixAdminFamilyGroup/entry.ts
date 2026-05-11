import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await base44.asServiceRole.entities.User.update('69dbef90b0bb680f2754a0d4', {
      family_group_id: '69fe68f208158b6c527b6e16',
      account_type: 'family'
    });

    return Response.json({ success: true, message: 'klmilton02@gmail.com family_group_id fixed' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});