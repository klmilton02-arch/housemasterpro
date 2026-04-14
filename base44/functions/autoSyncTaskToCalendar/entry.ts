import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    // Only process create/update, skip delete
    if (event?.type === 'delete') return Response.json({ status: 'skipped' });

    const task = data;
    if (!task || !task.next_due_date) return Response.json({ status: 'no_due_date' });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const startDate = task.next_due_date;
    const description = [
      task.description || '',
      task.assigned_to_name ? `Assigned to: ${task.assigned_to_name}` : '',
      `Category: ${task.category || 'General'}`,
      `Frequency: every ${task.frequency_days || '?'} days`,
    ].filter(Boolean).join('\n');

    const eventBody = {
      summary: task.name,
      description,
      start: { date: startDate },
      end: { date: startDate },
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
        return Response.json({ status: 'updated' });
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
      return Response.json({ status: 'created', eventId: created.id });
    }

    const err = await res.json();
    return Response.json({ status: 'error', detail: err?.error?.message }, { status: 500 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});