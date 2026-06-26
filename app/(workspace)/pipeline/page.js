import Link from 'next/link'
import Icon from '@/src/components/Icon'
import PipelineBoard from '@/components/pipeline-board'
import { requireAppContext } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const { supabase, workspace } = await requireAppContext()
  const [{ data: deals = [] }, { data: outreachLogs = [] }] = await Promise.all([
    supabase.from('deals').select('id,deal_title,stage,value,probability,temperature,source,companies(company_name)').eq('workspace_id', workspace.id).order('updated_at', { ascending: false }),
    supabase.from('outreach_logs').select('deal_id,channel,outcome,message,created_at,next_follow_up_at').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(120),
  ])
  const latestOutreachByDeal = new Map()
  outreachLogs.forEach((log) => {
    if (!latestOutreachByDeal.has(log.deal_id)) latestOutreachByDeal.set(log.deal_id, log)
  })
  const dealsWithOutreach = deals.map((deal) => ({ ...deal, last_outreach: latestOutreachByDeal.get(deal.id) || null }))
  return <><header className="page-heading"><div><h1>Pipeline</h1><p>Every conversation, deal, and next move in one view.</p></div><Link className="primary-button" href="/pipeline/new"><Icon name="plus" size={17}/>New deal</Link></header><PipelineBoard deals={dealsWithOutreach}/></>
}
