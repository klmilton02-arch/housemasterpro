import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { old_room, new_room, family_group_id } = await req.json();
    if (!old_room || !new_room) return Response.json({ error: 'Missing old_room or new_room' }, { status: 400 });

    // Fetch all tasks in the old room (service role to bypass RLS)
    let allTasks = [];
    let page = 0;
    const pageSize = 200;
    while (true) {
      const batch = await base44.asServiceRole.entities.Task.filter({ room: old_room }, '-created_date', pageSize, page * pageSize);
      allTasks = allTasks.concat(batch);
      if (batch.length < pageSize) break;
      page++;
    }

    // Filter to only tasks belonging to this family group (or created by this user)
    const tasksToUpdate = allTasks.filter(t =>
      (family_group_id && t.family_group_id === family_group_id) ||
      t.created_by === user.email ||
      t.personal_owner_email === user.email
    );

    // Bulk update room field
    await Promise.all(tasksToUpdate.map(t =>
      base44.asServiceRole.entities.Task.update(t.id, { room: new_room })
    ));

    return Response.json({ success: true, updated: tasksToUpdate.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});