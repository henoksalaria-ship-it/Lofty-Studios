import Link from 'next/link'
import { requireAppContext } from '@/lib/auth'
import { money } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const { supabase, workspace } = await requireAppContext()
  const { data: companies = [] } = await supabase.from('companies').select('id,company_name,industry,source,created_at,deals(id,value,stage),contacts(id,name,email,phone)').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(50)
  return <><header className="page-heading"><div><h1>Companies</h1><p>Your growing record of the brands, sponsors, and partners behind the work.</p></div><Link className="primary-button" href="/pipeline/new">Add company</Link></header><section className="panel performance-table"><div className="section-label"><h2>Company directory</h2><span className="text-action">{companies.length} companies</span></div><div className="table-wrap"><table><thead><tr><th>Company</th><th>Industry</th><th>Primary contact</th><th>Open value</th><th>Source</th></tr></thead><tbody>{companies.length ? companies.map((company) => { const activeValue = (company.deals || []).filter((deal) => !['closed_won', 'lost_not_now'].includes(deal.stage)).reduce((sum, deal) => sum + Number(deal.value || 0), 0); return <tr key={company.id}><td><strong>{company.company_name}</strong></td><td>{company.industry || '—'}</td><td>{company.contacts?.[0]?.name || '—'}</td><td>{money(activeValue)}</td><td>{company.source || '—'}</td></tr> }) : <tr><td colSpan="5"><div className="empty-board">Companies appear here automatically when you capture a lead.</div></td></tr>}</tbody></table></div></section></>
}
