import Link from 'next/link'
import Icon from '@/src/components/Icon'
import PipelineBoard from '@/components/pipeline-board'
import { requireAppContext } from '@/lib/auth'
import { money } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const { supabase, workspace } = await requireAppContext()
  const { data: deals = [] } = await supabase.from('deals').select('id,deal_title,stage,value,probability,temperature,source,companies(company_name)').eq('workspace_id', workspace.id).order('updated_at', { ascending: false })
  const openValue = deals.filter((deal) => !['closed_won', 'lost_not_now'].includes(deal.stage)).reduce((sum, deal) => sum + Number(deal.value || 0), 0)
  return <><header className="page-heading"><div><h1>Pipeline</h1><p>Every conversation, deal, and next move in one view.</p></div><Link className="primary-button" href="/pipeline/new"><Icon name="plus" size={17}/>New deal</Link></header><div className="pipeline-toolbar"><label className="search-box"><Icon name="search" size={17}/><input placeholder="Search is coming with live filters" readOnly /></label><span className="pipeline-value">Open pipeline <strong>{money(openValue)}</strong></span></div><p className="pipeline-hint">Drag a deal from one stage to another. The change is saved immediately and reflected on the dashboard.</p><PipelineBoard deals={deals}/></>
}
