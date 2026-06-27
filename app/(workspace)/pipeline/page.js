import Link from 'next/link'
import Icon from '@/src/components/Icon'
import PipelineBoard from '@/components/pipeline-board'
import { requireAppContext } from '@/lib/auth'
import { buildFinanceChecks } from '@/lib/reliability.mjs'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const { supabase, workspace } = await requireAppContext()
  const [{ data: deals = [] }, { data: outreachLogs = [] }, { data: financeRecords = [] }] = await Promise.all([
    supabase.from('deals').select('id,deal_title,stage,value,probability,temperature,source,owner_id,duplicate_warning,companies!deals_company_id_fkey(company_name)').eq('workspace_id', workspace.id).order('updated_at', { ascending: false }),
    supabase.from('outreach_logs').select('deal_id,channel,outcome,message,created_at,next_follow_up_at').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(120),
    supabase.from('finance_records').select('deal_id,total_amount,paid_amount,remaining_amount,payment_status,due_date,invoice_number,created_at').eq('workspace_id', workspace.id),
  ])
  const latestOutreachByDeal = new Map()
  outreachLogs.forEach((log) => {
    if (!latestOutreachByDeal.has(log.deal_id)) latestOutreachByDeal.set(log.deal_id, log)
  })
  const checks = buildFinanceChecks({ deals, records: financeRecords })
  const checksByDeal = new Map()
  checks.forEach((check) => {
    const list = checksByDeal.get(check.deal_id) || []
    list.push(check)
    checksByDeal.set(check.deal_id, list)
  })
  const financeByDeal = new Map()
  financeRecords.forEach((record) => {
    const current = financeByDeal.get(record.deal_id) || { remaining: 0, overdue: false, count: 0 }
    current.remaining += Number(record.remaining_amount || 0)
    current.count += 1
    current.overdue ||= Number(record.remaining_amount || 0) > 0 && record.due_date && new Date(record.due_date) < new Date()
    financeByDeal.set(record.deal_id, current)
  })
  const dealsWithOutreach = deals.map((deal) => {
    const finance = financeByDeal.get(deal.id)
    const financeStatus = !finance ? 'none' : finance.overdue ? 'overdue' : finance.remaining > 0 ? 'unpaid' : 'paid'
    return { ...deal, finance_status: financeStatus, finance_checks: checksByDeal.get(deal.id) || [], last_outreach: latestOutreachByDeal.get(deal.id) || null }
  })
  return <><header className="page-heading"><div><h1>Pipeline</h1><p>Every conversation, deal, and next move in one view.</p></div><Link className="primary-button" href="/pipeline/new"><Icon name="plus" size={17}/>New deal</Link></header><PipelineBoard deals={dealsWithOutreach}/></>
}
