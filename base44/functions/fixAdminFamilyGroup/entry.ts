import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // List all users and find the target by email
    const allUsers = await base44.asServiceRole.entities.User.list();
    const target = allUsers.find(u => u.email === 'klmilton02@gmail.com');

    if (!target) {
      return Response.json({ error: 'User not found', allEmails: allUsers.map(u => u.email) }, { status: 404 });
    }

    await base44.asServiceRole.entities.User.update(target.id, {
      family_group_id: '69fe68f208158b6c527b6e16',
      account_type: 'family'
    });

    // Verify
    const allUsers2 = await base44.asServiceRole.entities.User.list();
    const updated = allUsers2.find(u => u.email === 'klmilton02@gmail.com');
    return Response.json({ success: true, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});