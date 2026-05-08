import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow admins or internal entity automation
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();

    const { event, data } = body;
    if (event?.type !== 'delete') return Response.json({ skipped: true });

    const task = data;
    if (!task?.calendar_event_id) return Response.json({ skipped: true, reason: 'no calendar event' });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.calendar_event_id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // 404 means already deleted — that's fine
    if (res.ok || res.status === 404 || res.status === 410) {
      return Response.json({ success: true });
    }

    const err = await res.json();
    return Response.json({ success: false, error: err?.error?.message }, { status: 500 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});