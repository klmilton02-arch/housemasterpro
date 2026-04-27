import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { taskId } = body;

    if (!taskId) {
      return Response.json({ error: 'taskId required' }, { status: 400 });
    }

    // Fetch the task to get calendar_event_id
    const tasks = await base44.entities.Task.filter({ id: taskId });
    const task = tasks[0];

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!task.calendar_event_id) {
      return Response.json({ success: true, message: 'No calendar event to delete' });
    }

    // Delete from Google Calendar
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.calendar_event_id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      const err = await res.json();
      return Response.json({ error: err?.error?.message || 'Failed to delete event' }, { status: 500 });
    }

    // Clear calendar_event_id from task
    await base44.entities.Task.update(taskId, { calendar_event_id: null });

    return Response.json({ success: true, message: 'Calendar event deleted' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});