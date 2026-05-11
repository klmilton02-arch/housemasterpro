import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const scarlett = allUsers.find(u => u.email === 'kellymilton02@gmail.com');
    if (!scarlett) return Response.json({ error: 'User not found' }, { status: 404 });

    await base44.asServiceRole.entities.User.update(scarlett.id, {
      account_type: 'family',
      family_group_id: '69fe68f208158b6c527b6e16'
    });

    return Response.json({ success: true, updated: scarlett.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});