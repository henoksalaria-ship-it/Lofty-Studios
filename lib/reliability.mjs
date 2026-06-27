export const OPEN_DEAL_STAGES = ['cold_leads', 'reached_out', 'open_deals', 'ongoing_deals', 'waiting_payment']

const companyNoiseWords = new Set(['the', 'inc', 'llc', 'ltd', 'limited', 'co', 'company', 'plc', 'corp', 'corporation', 'studio', 'studios'])

export function normalizeCompanyName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((part) => part && !companyNoiseWords.has(part))
    .join(' ')
    .trim()
}

export function normalizePhone(value) {
  return String(value || '').replace(/\D+/g, '')
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function extractDomain(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  const candidate = raw.includes('@') ? raw.split('@').pop() : raw
  try {
    const url = new URL(candidate.startsWith('http') ? candidate : `https://${candidate}`)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return candidate.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

function wordScore(left, right) {
  const leftWords = new Set(normalizeCompanyName(left).split(' ').filter(Boolean))
  const rightWords = new Set(normalizeCompanyName(right).split(' ').filter(Boolean))
  if (!leftWords.size || !rightWords.size) return 0
  const overlap = [...leftWords].filter((word) => rightWords.has(word)).length
  return overlap / Math.max(leftWords.size, rightWords.size)
}

export function buildDuplicateWarnings({ input = {}, companies = [], contacts = [], deals = [] }) {
  const companyKey = normalizeCompanyName(input.companyName)
  const email = normalizeEmail(input.email)
  const phone = normalizePhone(input.phone)
  const domain = extractDomain(input.website || input.email)
  const openStages = new Set(OPEN_DEAL_STAGES)
  const warnings = []
  let preferredCompanyId = input.company_id || null
  let preferredContactId = input.contact_id || null

  const companyMatches = companies
    .map((company) => {
      const score = companyKey ? wordScore(company.company_name, companyKey) : 0
      const sameName = companyKey && normalizeCompanyName(company.company_name) === companyKey
      const sameDomain = domain && extractDomain(company.website || company.email) === domain
      const reason = sameName ? 'exact company name' : sameDomain ? 'same website or email domain' : score >= 0.6 ? 'similar company name' : ''
      return reason ? { ...company, match_score: sameName || sameDomain ? 1 : score, match_reason: reason } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.match_score - a.match_score)

  if (companyMatches[0]) {
    preferredCompanyId ||= companyMatches[0].id
    warnings.push({
      type: companyMatches[0].match_reason === 'exact company name' ? 'exact_company' : 'similar_company',
      message: `Likely duplicate: ${companyMatches[0].company_name} matches by ${companyMatches[0].match_reason}.`,
      company_id: companyMatches[0].id,
    })
  }

  const contactMatches = contacts
    .filter((contact) => {
      const sameEmail = email && normalizeEmail(contact.email) === email
      const samePhone = phone && normalizePhone(contact.phone) === phone
      return sameEmail || samePhone
    })

  if (contactMatches[0]) {
    preferredContactId ||= contactMatches[0].id
    preferredCompanyId ||= contactMatches[0].company_id
    warnings.push({
      type: 'matching_contact',
      message: `${contactMatches[0].name} already exists with the same ${email && normalizeEmail(contactMatches[0].email) === email ? 'email' : 'phone'}.`,
      company_id: contactMatches[0].company_id,
      contact_id: contactMatches[0].id,
    })
  }

  const openDealMatches = deals.filter((deal) => {
    const sameCompany = preferredCompanyId && deal.company_id === preferredCompanyId
    const sameTitle = input.dealTitle && normalizeCompanyName(deal.deal_title) === normalizeCompanyName(input.dealTitle)
    return openStages.has(deal.stage) && (sameCompany || sameTitle)
  })

  if (openDealMatches[0]) {
    warnings.push({
      type: 'open_deal',
      message: `${openDealMatches[0].deal_title} is already open for this company.`,
      company_id: openDealMatches[0].company_id,
      deal_id: openDealMatches[0].id,
    })
  }

  return {
    companyMatches,
    contactMatches,
    openDealMatches,
    preferredCompanyId,
    preferredContactId,
    warnings,
    hasWarnings: warnings.length > 0,
  }
}

export function goalActualAmount(goal, { records = [], deals = [] } = {}) {
  const start = goal.period_start ? new Date(`${goal.period_start}T00:00:00`) : null
  const end = goal.period_end ? new Date(`${goal.period_end}T23:59:59`) : null
  const inPeriod = (value) => {
    if (!value) return true
    const date = new Date(value)
    return (!start || date >= start) && (!end || date <= end)
  }
  const periodRecords = records.filter((record) => inPeriod(record.due_date || record.created_at))
  if (goal.goal_type === 'revenue') return periodRecords.reduce((sum, record) => sum + Number(record.total_amount || 0), 0)
  if (goal.goal_type === 'collections') return periodRecords.reduce((sum, record) => sum + Number(record.paid_amount || 0), 0)
  if (goal.goal_type === 'cash_flow') return periodRecords.reduce((sum, record) => sum + Number(record.paid_amount || 0) - Number(record.expense_amount || 0), 0)
  if (goal.goal_type === 'pipeline') return deals.filter((deal) => OPEN_DEAL_STAGES.includes(deal.stage)).reduce((sum, deal) => sum + Number(deal.value || 0), 0)
  if (goal.goal_type === 'expense_control') return periodRecords.reduce((sum, record) => sum + Number(record.expense_amount || 0), 0)
  if (goal.goal_type === 'savings') return Math.max(0, periodRecords.reduce((sum, record) => sum + Number(record.paid_amount || 0) - Number(record.expense_amount || 0), 0))
  return Number(goal.current_amount || 0)
}

export function goalProgress(goal, context) {
  const target = Number(goal.target_amount || 0)
  if (!target) return 0
  return Math.min(100, Math.max(0, Math.round((goalActualAmount(goal, context) / target) * 100)))
}

export function buildFinanceChecks({ records = [], deals = [], now = new Date() } = {}) {
  const recordsByDeal = new Map()
  records.forEach((record) => {
    const dealId = record.deal_id || record.deals?.id
    if (!dealId) return
    const list = recordsByDeal.get(dealId) || []
    list.push(record)
    recordsByDeal.set(dealId, list)
  })

  const checks = []
  deals.forEach((deal) => {
    const dealRecords = recordsByDeal.get(deal.id) || []
    const invoiced = dealRecords.reduce((sum, record) => sum + Number(record.total_amount || 0), 0)
    const remaining = dealRecords.reduce((sum, record) => sum + Number(record.remaining_amount ?? Math.max(Number(record.total_amount || 0) - Number(record.paid_amount || 0), 0)), 0)
    if (deal.stage === 'closed_won' && !dealRecords.length) checks.push({ type: 'missing_finance', deal_id: deal.id, severity: 'warning', message: `${deal.deal_title} is closed won with no finance record.` })
    if (dealRecords.length && Number(deal.value || 0) > 0 && Math.abs(invoiced - Number(deal.value || 0)) > 1) checks.push({ type: 'value_mismatch', deal_id: deal.id, severity: 'warning', message: `${deal.deal_title} value and invoices do not balance.` })
    if (deal.stage === 'waiting_payment' && remaining <= 0 && dealRecords.length) checks.push({ type: 'paid_waiting', deal_id: deal.id, severity: 'success', message: `${deal.deal_title} is paid but still waiting payment.` })
  })

  records.forEach((record) => {
    const remaining = Number(record.remaining_amount ?? Math.max(Number(record.total_amount || 0) - Number(record.paid_amount || 0), 0))
    if (remaining > 0 && record.due_date && new Date(record.due_date) < now) {
      checks.push({ type: 'overdue_balance', deal_id: record.deal_id || record.deals?.id, severity: 'danger', message: `${record.invoice_number || 'Invoice'} is overdue with an unpaid balance.` })
    }
  })

  return checks
}
