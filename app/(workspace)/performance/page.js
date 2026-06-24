import { requireAppContext } from '@/lib/auth'
import { money, percent, shortDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function PerformancePage() {
  const { supabase, workspace } = await requireAppContext()
  const { data: entries = [] } = await supabase.from('performance_entries').select('id,title,platform,views,likes,comments,shares,saves,engagement_rate,revenue_attached,posted_at,content_type').eq('workspace_id', workspace.id).order('posted_at', { ascending: false }).limit(50)
  const totalViews = entries.reduce((sum, entry) => sum + Number(entry.views || 0), 0)
  const averageEngagement = entries.length ? entries.reduce((sum, entry) => sum + Number(entry.engagement_rate || 0), 0) / entries.length : 0
  const attributedRevenue = entries.reduce((sum, entry) => sum + Number(entry.revenue_attached || 0), 0)
  return <><header className="page-heading"><div><h1>Performance analyzer</h1><p>Measure what gets reach, what makes clients happy, and what turns into revenue.</p></div></header><section className="analyzer-summary"><section><span>Tracked posts</span><strong>{entries.length}</strong><small>Manual entry + CSV ready</small></section><section><span>Total views</span><strong>{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(totalViews)}</strong><small>Across all platforms</small></section><section><span>Avg. engagement</span><strong>{percent(averageEngagement)}</strong><small>Weighted improvement starts here</small></section><section><span>Revenue attached</span><strong>{money(attributedRevenue)}</strong><small>Campaign attribution</small></section></section><section className="panel performance-table"><div className="section-label"><h2>Tracked content</h2><span className="text-action">Manual import is the first production release</span></div><div className="table-wrap"><table><thead><tr><th>Content</th><th>Platform</th><th>Views</th><th>Engagement</th><th>Revenue</th><th>Posted</th></tr></thead><tbody>{entries.length ? entries.map((entry) => <tr key={entry.id}><td><strong>{entry.title}</strong></td><td>{entry.platform}</td><td>{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(Number(entry.views || 0))}</td><td>{percent(entry.engagement_rate)}</td><td>{money(entry.revenue_attached)}</td><td>{shortDate(entry.posted_at)}</td></tr>) : <tr><td colSpan="6"><div className="empty-board">No performance rows yet. Use the database for manual entry or bring in your first CSV next.</div></td></tr>}</tbody></table></div></section></>
}
