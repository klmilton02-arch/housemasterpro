import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    // Called from entity automation — payload has event + data
    const task = body.data || body.task;
    if (!task || !task.id || !task.next_due_date) {
      return Response.json({ skipped: true, reason: 'no task or due date' });
    }

    // Skip completed tasks — remove their calendar event if one exists
    if (task.status === 'Completed') {
      if (task.calendar_event_id) {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.calendar_event_id}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
        );
        await base44.asServiceRole.entities.Task.update(task.id, { calendar_event_id: null });
      }
      return Response.json({ skipped: true, reason: 'task completed' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const description = [
      task.description || '',
      task.assigned_to_name ? `Assigned to: ${task.assigned_to_name}` : '',
      task.category ? `Category: ${task.category}` : '',
      task.frequency_days ? `Repeats every ${task.frequency_days} days` : '',
    ].filter(Boolean).join('\n');

    const eventBody = {
      summary: `🏠 ${task.name}`,
      description,
      start: { date: task.next_due_date },
      end: { date: task.next_due_date },
      extendedProperties: {
        private: { homeflow_task_id: task.id },
      },
    };

    if (task.calendar_event_id) {
      // Try to update existing event
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.calendar_event_id}`,
        { method: 'PUT', headers, body: JSON.stringify(eventBody) }
      );
      if (res.ok) {
        return Response.json({ success: true, action: 'updated' });
      }
      // Event was deleted externally — fall through to create
    }

    // Create new event
    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      { method: 'POST', headers, body: JSON.stringify(eventBody) }
    );
    if (res.ok) {
      const created = await res.json();
      await base44.asServiceRole.entities.Task.update(task.id, { calendar_event_id: created.id });
      return Response.json({ success: true, action: 'created', eventId: created.id });
    }

    const err = await res.json();
    return Response.json({ success: false, error: err?.error?.message }, { status: 500 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});