import GuidedDealForm from '@/components/guided-deal-form'
import { requireAppContext } from '@/lib/auth'

export default async function NewDealPage() {
  const { supabase, workspace } = await requireAppContext()
  const [{ data: companies = [] }, { data: contacts = [] }, { data: deals = [] }] = await Promise.all([
    supabase.from('companies').select('id,company_name,website,email,source,industry').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(500),
    supabase.from('contacts').select('id,company_id,name,email,phone').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(1000),
    supabase.from('deals').select('id,company_id,deal_title,stage,companies!deals_company_id_fkey(company_name)').eq('workspace_id', workspace.id).order('updated_at', { ascending: false }).limit(1000),
  ])
  return <><header className="page-heading"><div><h1>New lead</h1><p>A guided flow that checks duplicates, reuses existing records, and creates the next follow-up.</p></div></header><GuidedDealForm workspaceId={workspace.id} companies={companies} contacts={contacts} deals={deals}/></>
}
