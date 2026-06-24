import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const validStages = new Set(['cold_leads', 'open_deals'])

function clean(value, maximum = 5000) {
  return String(value ?? '').trim().slice(0, maximum)
}

function secretMatches(received, expected) {
  if (!received || !expected) return false
  const receivedBuffer = Buffer.from(received)
  const expectedBuffer = Buffer.from(expected)
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer)
}

export async function POST(request) {
  if (!secretMatches(request.headers.get('x-lofty-ingest-secret'), process.env.LOFTY_LEAD_INGEST_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 }) }

  const workspaceSlug = clean(body.workspace_slug, 120)
  const companyName = clean(body.company_name, 180)
  const contactName = clean(body.contact_person, 160)
  if (!workspaceSlug || !companyName || !contactName) return NextResponse.json({ error: 'workspace_slug, company_name, and contact_person are required.' }, { status: 422 })

  const admin = createAdminClient()
  const { data: workspace, error: workspaceError } = await admin.from('workspaces').select('id,created_by').eq('slug', workspaceSlug).maybeSingle()
  if (workspaceError || !workspace) return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 })

  const companyKey = companyName.toLowerCase()
  let { data: company } = await admin.from('companies').select('id').eq('workspace_id', workspace.id).eq('company_name_key', companyKey).maybeSingle()
  if (!company) {
    const { data, error } = await admin.from('companies').insert({ workspace_id: workspace.id, company_name: companyName, industry: clean(body.industry, 120) || null, website: clean(body.website, 500) || null, instagram: clean(body.social_handle, 180) || null, phone: clean(body.phone, 60) || null, email: clean(body.email, 180) || null, source: clean(body.how_they_found_us, 60) || 'website' }).select('id').single()
    if (error) return NextResponse.json({ error: 'Could not create company.' }, { status: 500 })
    company = data
  }

  const { data: contact, error: contactError } = await admin.from('contacts').insert({ workspace_id: workspace.id, company_id: company.id, name: contactName, email: clean(body.email, 180) || null, phone: clean(body.phone, 60) || null, instagram: clean(body.social_handle, 180) || null }).select('id').single()
  if (contactError) return NextResponse.json({ error: 'Could not create contact.' }, { status: 500 })

  const stage = validStages.has(body.initial_stage) ? body.initial_stage : 'cold_leads'
  const { data: deal, error: dealError } = await admin.from('deals').insert({ workspace_id: workspace.id, company_id: company.id, primary_contact_id: contact.id, deal_title: clean(body.service_requested, 180) || `${companyName} inquiry`, stage, value: Math.max(0, Number(body.budget_amount || 0)), source: clean(body.how_they_found_us, 60) || 'website', owner_id: workspace.created_by, notes: clean(body.message) || null }).select('id').single()
  if (dealError) return NextResponse.json({ error: 'Could not create deal.' }, { status: 500 })

  await admin.from('tasks').insert({ workspace_id: workspace.id, deal_id: deal.id, title: `Follow up with ${companyName}`, due_date: new Date().toISOString(), priority: 'high', assigned_to: workspace.created_by })
  await admin.from('website_lead_submissions').insert({ workspace_id: workspace.id, deal_id: deal.id, source_payload: { company_name: companyName, contact_person: contactName, service_requested: clean(body.service_requested, 180), how_they_found_us: clean(body.how_they_found_us, 60), received_at: new Date().toISOString() } })
  return NextResponse.json({ id: deal.id, stage, message: 'Lead created and follow-up task assigned.' }, { status: 201 })
}
