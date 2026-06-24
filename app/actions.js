'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const stages = new Set(['cold_leads', 'reached_out', 'open_deals', 'ongoing_deals', 'waiting_payment', 'closed_won', 'lost_not_now'])

function clean(value, maximum = 5000) {
  return String(value ?? '').trim().slice(0, maximum)
}

function toSlug(value) {
  return clean(value, 90).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function getUserClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function createWorkspace(formData) {
  const { supabase, user } = await getUserClient()
  const name = clean(formData.get('name'), 120)
  if (!name) throw new Error('Workspace name is required.')
  const baseSlug = toSlug(name) || 'lofty-studios'
  const slug = `${baseSlug}-${user.id.slice(0, 6)}`

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: clean(formData.get('display_name'), 120) || user.email?.split('@')[0] || 'Lofty member',
  })
  if (profileError) throw new Error(profileError.message)

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({ name, slug, created_by: user.id })
    .select('id')
    .single()
  if (workspaceError) throw new Error(workspaceError.message)

  const { error: membershipError } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })
  if (membershipError) throw new Error(membershipError.message)
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function toggleTask(formData) {
  const { supabase } = await getUserClient()
  const taskId = clean(formData.get('task_id'), 80)
  const nextStatus = clean(formData.get('next_status'), 20)
  if (!taskId || !['open', 'done'].includes(nextStatus)) return
  const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', taskId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function createLead(formData) {
  const { supabase, user } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const companyName = clean(formData.get('company_name'), 180)
  const dealTitle = clean(formData.get('deal_title'), 180) || `${companyName} campaign`
  const contactName = clean(formData.get('contact_name'), 160)
  const value = Number(formData.get('value') || 0)
  if (!workspaceId || !companyName) throw new Error('Company name is required.')

  const companyNameKey = companyName.toLowerCase()
  let { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('company_name_key', companyNameKey)
    .maybeSingle()

  if (!company) {
    const { data, error } = await supabase
      .from('companies')
      .insert({ workspace_id: workspaceId, company_name: companyName, industry: clean(formData.get('industry'), 120) || null, source: clean(formData.get('source'), 60) || 'website' })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    company = data
  }

  let contactId = null
  if (contactName) {
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({ company_id: company.id, workspace_id: workspaceId, name: contactName, email: clean(formData.get('email'), 180) || null, phone: clean(formData.get('phone'), 60) || null })
      .select('id')
      .single()
    if (contactError) throw new Error(contactError.message)
    contactId = contact.id
  }

  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .insert({ workspace_id: workspaceId, company_id: company.id, primary_contact_id: contactId, deal_title: dealTitle, stage: 'cold_leads', value: Number.isFinite(value) ? Math.max(value, 0) : 0, source: clean(formData.get('source'), 60) || 'website', owner_id: user.id, notes: clean(formData.get('notes')) || null })
    .select('id')
    .single()
  if (dealError) throw new Error(dealError.message)

  const { error: taskError } = await supabase.from('tasks').insert({
    workspace_id: workspaceId,
    deal_id: deal.id,
    title: `Follow up with ${companyName}`,
    due_date: new Date().toISOString(),
    priority: 'high',
    assigned_to: user.id,
  })
  if (taskError) throw new Error(taskError.message)
  revalidatePath('/dashboard')
  revalidatePath('/pipeline')
  redirect('/pipeline')
}

export async function updateDealStage(formData) {
  const { supabase } = await getUserClient()
  const dealId = clean(formData.get('deal_id'), 80)
  const stage = clean(formData.get('stage'), 40)
  if (!dealId || !stages.has(stage)) return
  const { error } = await supabase.from('deals').update({ stage }).eq('id', dealId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/pipeline')
}

export async function createCalendarEvent(formData) {
  const { supabase, user } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const title = clean(formData.get('title'), 180)
  const startDate = clean(formData.get('start_date'), 40)
  if (!workspaceId || !title || !startDate) throw new Error('Title and start date are required.')
  const { error } = await supabase.from('calendar_events').insert({
    workspace_id: workspaceId,
    title,
    event_type: clean(formData.get('event_type'), 50) || 'content_post',
    start_date: new Date(startDate).toISOString(),
    status: 'planned',
    assigned_to: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
}

export async function createContentIdea(formData) {
  const { supabase, user } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const title = clean(formData.get('title'), 220)
  if (!workspaceId || !title) throw new Error('An idea needs a title.')
  const { error } = await supabase.from('content_ideas').insert({
    workspace_id: workspaceId,
    title,
    description: clean(formData.get('description')) || null,
    platform: clean(formData.get('platform'), 60) || null,
    content_type: clean(formData.get('content_type'), 80) || null,
    status: clean(formData.get('status'), 40) || 'idea',
    created_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/calendar')
}

export async function scheduleContentIdea(formData) {
  const { supabase, user } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const contentIdeaId = clean(formData.get('content_idea_id'), 80)
  const title = clean(formData.get('title'), 220)
  const startDate = clean(formData.get('start_date'), 40)
  if (!workspaceId || !contentIdeaId || !title || !startDate) return
  const { error: eventError } = await supabase.from('calendar_events').insert({
    workspace_id: workspaceId,
    content_idea_id: contentIdeaId,
    title,
    event_type: 'content_post',
    start_date: new Date(startDate).toISOString(),
    status: 'planned',
    assigned_to: user.id,
  })
  if (eventError) throw new Error(eventError.message)
  const { error: ideaError } = await supabase.from('content_ideas').update({ status: 'ready' }).eq('id', contentIdeaId)
  if (ideaError) throw new Error(ideaError.message)
  revalidatePath('/calendar')
  revalidatePath('/dashboard')
}

export async function createFinanceRecord(formData) {
  const { supabase } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const dealId = clean(formData.get('deal_id'), 80)
  const totalAmount = Number(formData.get('total_amount') || 0)
  const paidAmount = Number(formData.get('paid_amount') || 0)
  if (!workspaceId || !dealId || !Number.isFinite(totalAmount) || totalAmount < 0 || !Number.isFinite(paidAmount) || paidAmount < 0 || paidAmount > totalAmount) throw new Error('Enter valid payment amounts.')
  const { error } = await supabase.from('finance_records').insert({
    workspace_id: workspaceId,
    deal_id: dealId,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    payment_status: clean(formData.get('payment_status'), 30) || (paidAmount ? 'partial' : 'pending'),
    due_date: clean(formData.get('due_date'), 40) ? new Date(clean(formData.get('due_date'), 40)).toISOString() : null,
    invoice_number: clean(formData.get('invoice_number'), 120) || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/finance')
  revalidatePath('/dashboard')
}
