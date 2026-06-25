import Icon from '@/src/components/Icon'
import { createCalendarEvent, createContentIdea, updateCalendarEventStatus } from '@/app/actions'
import { requireAppContext } from '@/lib/auth'
import { shortDate } from '@/lib/format'
import ContentPlanner from '@/components/content-planner'

export const dynamic = 'force-dynamic'

const eventStatuses = {
  planned: 'Planned',
  in_progress: 'In progress',
  complete: 'Complete',
  cancelled: 'Cancelled',
}

const eventTypes = {
  content_post: 'Content post',
  brand_shoot: 'Brand shoot',
  client_deadline: 'Client deadline',
  editing_deadline: 'Editing deadline',
  meeting: 'Meeting',
  payment_due: 'Payment due',
  campaign_launch: 'Campaign launch',
}

export default async function CalendarPage() {
  const { supabase, workspace } = await requireAppContext()
  const [{ data: events = [] }, { data: ideas = [] }, { data: deals = [] }] = await Promise.all([
    supabase.from('calendar_events').select('id,title,start_date,end_date,event_type,status,assigned_to,deals(deal_title,companies(company_name))').eq('workspace_id', workspace.id).order('start_date').limit(40),
    supabase.from('content_ideas').select('id,title,description,platform,content_type,status,created_at').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(60),
    supabase.from('deals').select('id,deal_title,companies(company_name)').eq('workspace_id', workspace.id).order('updated_at', { ascending: false }),
  ])
  const defaultDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  return <>
    <header className="page-heading">
      <div>
        <h1>Content calendar</h1>
        <p>Plan shoots, posts, deadlines, campaigns, and the small details that keep them moving.</p>
      </div>
    </header>

    <section className="panel">
      <form className="event-form event-form-wide" action={createCalendarEvent}>
        <input type="hidden" name="workspace_id" value={workspace.id}/>
        <label>What is happening?<input required name="title" placeholder="e.g. Hey Mobile shoot day 1"/></label>
        <label>Deal<select name="deal_id" defaultValue=""><option value="">No deal</option>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.companies?.company_name || deal.deal_title} - {deal.deal_title}</option>)}</select></label>
        <label>When<input required name="start_date" type="datetime-local" defaultValue={defaultDate}/></label>
        <label>Event type<select name="event_type" defaultValue="content_post">{Object.entries(eventTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button className="primary-button" type="submit"><Icon name="plus" size={16}/>Add event</button>
      </form>
    </section>

    <ContentPlanner workspaceId={workspace.id} ideas={ideas} events={events}/>

    <div className="dashboard-grid bottom" style={{ marginTop: 8 }}>
      <section className="panel new-panel">
        <h2>Save an idea</h2>
        <p>Ideas become a real production asset the moment they enter the system.</p>
        <form action={createContentIdea}>
          <input type="hidden" name="workspace_id" value={workspace.id}/>
          <label>Idea title<input required name="title" placeholder="e.g. Make someone laugh in 10 seconds"/></label>
          <div className="form-row">
            <label>Platform<select name="platform" defaultValue="tiktok"><option value="tiktok">TikTok</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option></select></label>
            <label>Stage<select name="status" defaultValue="idea"><option value="idea">Raw idea</option><option value="scripted">Scripted</option><option value="ready_to_shoot">Ready to shoot</option><option value="ready">Finalized</option></select></label>
          </div>
          <label>Notes<textarea name="description" placeholder="Hook, visual angle, brand context, or first line of the script."/></label>
          <button className="primary-button" type="submit">Save idea</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-label">
          <h2>Scheduled work</h2>
          <span className="text-action">{events.length} events</span>
        </div>
        <div className="timeline-list calendar-status-list">
          {events.length ? events.slice(0, 10).map((event) => <div className="timeline-row calendar-status-row" key={event.id}>
            <time>{shortDate(event.start_date)}</time>
            <span>
              <strong>{event.title}</strong>
              <small>{event.deals?.companies?.company_name || event.deals?.deal_title || eventStatuses[event.status]}</small>
            </span>
            <span className="timeline-type">{event.event_type.replaceAll('_', ' ')}</span>
            <form action={updateCalendarEventStatus}>
              <input type="hidden" name="workspace_id" value={workspace.id}/>
              <input type="hidden" name="event_id" value={event.id}/>
              <select name="status" defaultValue={event.status}>{Object.entries(eventStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <button className="filter-button" type="submit">Save</button>
            </form>
          </div>) : <div className="empty-board">Your calendar is open. Add the first post, shoot, deadline, or payment reminder.</div>}
        </div>
      </section>
    </div>
  </>
}
