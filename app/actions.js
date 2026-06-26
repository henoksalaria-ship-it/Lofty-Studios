'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const stages = new Set(['cold_leads', 'reached_out', 'open_deals', 'ongoing_deals', 'waiting_payment', 'closed_won', 'lost_not_now'])
const financeGoalTypes = new Set(['cash_flow', 'revenue', 'collections', 'expense_control', 'savings', 'pipeline'])
const financeGoalStatuses = new Set(['active', 'paused', 'complete', 'archived'])
const assignableRoles = new Set(['admin', 'sales', 'editor', 'finance', 'viewer'])
const outreachChannels = new Set(['call', 'email', 'dm', 'whatsapp', 'meeting', 'proposal'])

function clean(value, maximum = 5000) {
  return String(value ?? '').trim().slice(0, maximum)
}

function toPositiveAmount(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

async function getUserClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

async function assertWorkspaceOwner(supabase, userId, workspaceId) {
  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (membership?.role !== 'owner') throw new Error('Only the workspace owner can manage roles.')
}

async function findAuthUserByEmail(admin, email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    const user = data?.users?.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user) return user
    if (!data?.users || data.users.length < 1000) return null
  }
  return null
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

export async function createOutreachLog(formData) {
  const { supabase, user } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const dealId = clean(formData.get('deal_id'), 80)
  const channel = clean(formData.get('channel'), 40) || 'email'
  const nextFollowUpAt = clean(formData.get('next_follow_up_at'), 40)
  if (!workspaceId || !dealId || !outreachChannels.has(channel)) throw new Error('Choose a deal and outreach channel.')

  const { error } = await supabase.from('outreach_logs').insert({
    workspace_id: workspaceId,
    deal_id: dealId,
    created_by: user.id,
    channel,
    message: clean(formData.get('message')) || null,
    outcome: clean(formData.get('outcome'), 500) || null,
    next_follow_up_at: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : null,
  })
  if (error) throw new Error(error.message)

  if (nextFollowUpAt) {
    const { data: deal } = await supabase
      .from('deals')
      .select('deal_title,companies(company_name)')
      .eq('workspace_id', workspaceId)
      .eq('id', dealId)
      .maybeSingle()
    const label = deal?.companies?.company_name || deal?.deal_title || 'deal'
    const { error: taskError } = await supabase.from('tasks').insert({
      workspace_id: workspaceId,
      deal_id: dealId,
      title: `Follow up with ${label}`,
      due_date: new Date(nextFollowUpAt).toISOString(),
      priority: 'high',
      assigned_to: user.id,
      created_by: user.id,
    })
    if (taskError) throw new Error(taskError.message)
  }

  revalidatePath('/outreach')
  revalidatePath('/pipeline')
  revalidatePath('/dashboard')
}

export async function createCalendarEvent(formData) {
  const { supabase, user } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const title = clean(formData.get('title'), 180)
  const startDate = clean(formData.get('start_date'), 40)
  const dealId = clean(formData.get('deal_id'), 80)
  if (!workspaceId || !title || !startDate) throw new Error('Title and start date are required.')
  const { error } = await supabase.from('calendar_events').insert({
    workspace_id: workspaceId,
    deal_id: dealId || null,
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

export async function updateCalendarEventStatus(formData) {
  const { supabase } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const eventId = clean(formData.get('event_id'), 80)
  const status = clean(formData.get('status'), 40)
  if (!workspaceId || !eventId || !['planned', 'in_progress', 'complete', 'cancelled'].includes(status)) throw new Error('Choose a valid calendar event status.')
  const { error } = await supabase
    .from('calendar_events')
    .update({ status })
    .eq('workspace_id', workspaceId)
    .eq('id', eventId)
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

export async function createFinanceGoal(formData) {
  const { supabase, user } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const title = clean(formData.get('title'), 160)
  const goalType = clean(formData.get('goal_type'), 40) || 'cash_flow'
  const targetAmount = toPositiveAmount(formData.get('target_amount'))
  const currentAmount = toPositiveAmount(formData.get('current_amount'))
  const periodStart = clean(formData.get('period_start'), 40) || new Date().toISOString().slice(0, 10)
  const periodEnd = clean(formData.get('period_end'), 40)
  if (!workspaceId || !title || !financeGoalTypes.has(goalType) || targetAmount <= 0 || !periodEnd) throw new Error('Enter a goal name, target amount, and end date.')

  const { error } = await supabase.from('finance_goals').insert({
    workspace_id: workspaceId,
    title,
    goal_type: goalType,
    target_amount: targetAmount,
    current_amount: Math.max(currentAmount, 0),
    period_start: periodStart,
    period_end: periodEnd,
    notes: clean(formData.get('notes')) || null,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/finance')
  revalidatePath('/dashboard')
}

export async function updateFinanceGoalProgress(formData) {
  const { supabase } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const goalId = clean(formData.get('goal_id'), 80)
  const currentAmount = toPositiveAmount(formData.get('current_amount'))
  const status = clean(formData.get('status'), 40) || 'active'
  if (!workspaceId || !goalId || !financeGoalStatuses.has(status)) throw new Error('Choose a valid goal and status.')

  const { error } = await supabase
    .from('finance_goals')
    .update({ current_amount: Math.max(currentAmount, 0), status })
    .eq('workspace_id', workspaceId)
    .eq('id', goalId)
  if (error) throw new Error(error.message)
  revalidatePath('/finance')
  revalidatePath('/dashboard')
}

export async function addWorkspaceMember(formData) {
  const { supabase, user } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const email = clean(formData.get('email'), 220).toLowerCase()
  const displayNameInput = clean(formData.get('display_name'), 120)
  const initialPassword = String(formData.get('initial_password') || '')
  const role = clean(formData.get('role'), 40)
  if (!workspaceId || !email || !assignableRoles.has(role)) throw new Error('Enter a teammate email and role.')
  await assertWorkspaceOwner(supabase, user.id, workspaceId)

  const admin = createAdminClient()
  let targetUser = await findAuthUserByEmail(admin, email)
  if (targetUser?.id === user.id) throw new Error('The owner role is already assigned to your account.')
  let existingMember = null
  if (targetUser) {
    const { data, error } = await admin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUser.id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    existingMember = data
    if (existingMember?.role === 'owner') throw new Error('The workspace owner role cannot be changed here.')
  }

  if (!targetUser && initialPassword.length < 8) throw new Error('Enter an initial password of at least 8 characters for new users.')
  if (targetUser && initialPassword && initialPassword.length < 8) throw new Error('Use at least 8 characters when resetting a teammate password.')

  const displayName = displayNameInput || targetUser?.user_metadata?.full_name || targetUser?.email?.split('@')[0] || email.split('@')[0] || 'Lofty member'

  if (!targetUser) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    })
    if (error) throw new Error(error.message)
    targetUser = data.user
  } else if (initialPassword) {
    const { data, error } = await admin.auth.admin.updateUserById(targetUser.id, {
      password: initialPassword,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    })
    if (error) throw new Error(error.message)
    targetUser = data.user
  }

  const { error: profileError } = await admin.from('profiles').upsert({ id: targetUser.id, display_name: displayName })
  if (profileError) throw new Error(profileError.message)

  const { error } = await admin
    .from('workspace_members')
    .upsert({ workspace_id: workspaceId, user_id: targetUser.id, role }, { onConflict: 'workspace_id,user_id' })
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function updateWorkspaceMemberRole(formData) {
  const { supabase, user } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const memberUserId = clean(formData.get('member_user_id'), 80)
  const role = clean(formData.get('role'), 40)
  if (!workspaceId || !memberUserId || !assignableRoles.has(role)) throw new Error('Choose a valid teammate and role.')
  if (memberUserId === user.id) throw new Error('The owner role cannot be changed from this hub.')
  await assertWorkspaceOwner(supabase, user.id, workspaceId)

  const admin = createAdminClient()
  const { data: existingMember, error: existingError } = await admin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberUserId)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)
  if (existingMember?.role === 'owner') throw new Error('The workspace owner role cannot be changed here.')

  const { error } = await admin
    .from('workspace_members')
    .update({ role })
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberUserId)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function removeWorkspaceMember(formData) {
  const { supabase, user } = await getUserClient()
  const workspaceId = clean(formData.get('workspace_id'), 80)
  const memberUserId = clean(formData.get('member_user_id'), 80)
  if (!workspaceId || !memberUserId) throw new Error('Choose a teammate to remove.')
  if (memberUserId === user.id) throw new Error('The workspace owner cannot remove their own access.')
  await assertWorkspaceOwner(supabase, user.id, workspaceId)

  const admin = createAdminClient()
  const { data: existingMember, error: existingError } = await admin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberUserId)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)
  if (existingMember?.role === 'owner') throw new Error('The workspace owner cannot be removed here.')

  const { error } = await admin
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberUserId)
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}
