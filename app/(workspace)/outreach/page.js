import { createOutreachLog } from '@/app/actions'
import { requireAppContext } from '@/lib/auth'
import { shortDate, STAGE_LABELS } from '@/lib/format'

export const dynamic = 'force-dynamic'

const channelLabels = {
  call: 'Call',
  email: 'Email',
  dm: 'DM',
  whatsapp: 'WhatsApp',
  meeting: 'Meeting',
  proposal: 'Proposal',
}

function defaultFollowUpDate() {
  const date = new Date(Date.now() + 1000 * 60 * 60 * 24)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default async function OutreachPage() {
  const { supabase, workspace } = await requireAppContext()
  const [{ data: deals = [] }, { data: logs = [] }] = await Promise.all([
    supabase.from('deals').select('id,deal_title,stage,companies!deals_company_id_fkey(company_name)').eq('workspace_id', workspace.id).order('updated_at', { ascending: false }),
    supabase.from('outreach_logs').select('id,channel,message,outcome,next_follow_up_at,created_at,deals(deal_title,stage,companies!deals_company_id_fkey(company_name))').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(60),
  ])

  const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7
  const recentLogs = logs.filter((log) => new Date(log.created_at).getTime() >= weekAgo)
  const touchedDeals = new Set(recentLogs.map((log) => log.deals?.deal_title || log.id))
  const followUps = logs.filter((log) => log.next_follow_up_at && new Date(log.next_follow_up_at).getTime() >= Date.now())
  const openDeals = deals.filter((deal) => !['closed_won', 'lost_not_now'].includes(deal.stage))

  return <><header className="page-heading"><div><h1>Outreach</h1><p>Log calls, emails, DMs, proposals, and next follow-ups against the deals they belong to.</p></div></header><section className="panel"><div className="metric-stack"><div><span>This week</span><strong>{recentLogs.length}</strong><small>Logged touches</small></div><div><span>Deals touched</span><strong>{touchedDeals.size}</strong><small>Recent activity</small></div><div><span>Follow-ups</span><strong>{followUps.length}</strong><small>Scheduled next steps</small></div><div><span>Open deals</span><strong>{openDeals.length}</strong><small>Pipeline focus</small></div></div></section><div className="dashboard-grid bottom outreach-layout"><section className="panel new-panel"><h2>Log outreach</h2><p>Each log becomes deal history. Add a follow-up date to create a task automatically.</p><form action={createOutreachLog}><input type="hidden" name="workspace_id" value={workspace.id}/><label>Deal<select required name="deal_id" defaultValue=""><option value="" disabled>Select a deal</option>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.companies?.company_name || deal.deal_title} - {STAGE_LABELS[deal.stage]}</option>)}</select></label><div className="form-row"><label>Channel<select name="channel" defaultValue="email">{Object.entries(channelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Next follow-up<input name="next_follow_up_at" type="datetime-local" defaultValue={defaultFollowUpDate()}/></label></div><label>Outcome<input name="outcome" placeholder="e.g. Asked for proposal, waiting on finance, booked meeting"/></label><label>Notes<textarea name="message" placeholder="What was said, promised, or needed next?"/></label><button className="primary-button" type="submit">Save outreach</button></form></section><section className="panel outreach-panel"><div className="section-label"><h2>Recent outreach</h2><span className="text-action">{logs.length} logs</span></div><div className="outreach-log-list">{logs.length ? logs.map((log) => <article className="outreach-row" key={log.id}><time>{shortDate(log.created_at)}</time><span><strong>{log.deals?.companies?.company_name || log.deals?.deal_title || 'Untitled deal'}</strong><small>{channelLabels[log.channel] || log.channel} - {STAGE_LABELS[log.deals?.stage] || 'Pipeline'}</small></span><p>{log.outcome || log.message || 'No outcome recorded yet.'}</p><em>{log.next_follow_up_at ? `Next: ${shortDate(log.next_follow_up_at)}` : 'No follow-up'}</em></article>) : <div className="empty-board compact-empty">No outreach logged yet. Start with the conversation that needs the next move.</div>}</div></section></div></>
}
